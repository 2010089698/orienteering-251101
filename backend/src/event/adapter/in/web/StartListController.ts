import 'reflect-metadata';
import { Request, Response, Router } from 'express';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
  validate,
} from 'class-validator';
import { plainToInstance, Type } from 'class-transformer';

import ConfigureStartListUseCase from '../../../../startList/application/command/ConfigureStartListUseCase';
import ConfigureStartListCommand from '../../../../startList/application/command/ConfigureStartListCommand';
import AssignClassesToLanesUseCase from '../../../../startList/application/command/AssignClassesToLanesUseCase';
import AssignClassesToLanesCommand from '../../../../startList/application/command/AssignClassesToLanesCommand';
import ScheduleParticipantsUseCase from '../../../../startList/application/command/ScheduleParticipantsUseCase';
import ScheduleParticipantsCommand from '../../../../startList/application/command/ScheduleParticipantsCommand';
import FinalizeStartListUseCase from '../../../../startList/application/command/FinalizeStartListUseCase';
import FinalizeStartListCommand from '../../../../startList/application/command/FinalizeStartListCommand';
import GetStartListDraftQueryHandler from '../../../../startList/application/query/GetStartListDraftQueryHandler';
import GetStartListDraftQuery from '../../../../startList/application/query/GetStartListDraftQuery';
import { toStartListDraftResponseDto } from '../../../../startList/application/query/StartListDraftResponseDto';
import StartListDraft from '../../../../startList/domain/StartListDraft';
import { presentStartListDraft } from './presenters/StartListPresenter';
import HttpValidationError from './errors/HttpValidationError';
import { mapValidationErrors } from './support/validation';

class ConfigureStartListRequestDto {
  @IsDateString({}, { message: '開始日時はISO8601形式で指定してください。' })
  public startDateTime!: string;

  @IsInt({ message: 'スタート間隔は整数で指定してください。' })
  @IsPositive({ message: 'スタート間隔は1以上の整数で指定してください。' })
  public intervalSeconds!: number;

  @IsInt({ message: 'レーン数は整数で指定してください。' })
  @Min(1, { message: 'レーン数は1以上の整数で指定してください。' })
  public laneCount!: number;
}

class LaneAssignmentRequestDto {
  @IsInt({ message: 'レーン番号は整数で指定してください。' })
  @Min(1, { message: 'レーン番号は1以上の整数で指定してください。' })
  public laneNumber!: number;

  @IsString({ message: 'エントリークラスIDは文字列で指定してください。' })
  @IsNotEmpty({ message: 'エントリークラスIDは必須です。' })
  public entryClassId!: string;
}

class AssignLanesRequestDto {
  @IsArray({ message: 'レーン割り当ては配列で指定してください。' })
  @ArrayNotEmpty({ message: 'レーン割り当てを1件以上指定してください。' })
  @ValidateNested({ each: true })
  @Type(() => LaneAssignmentRequestDto)
  public assignments!: LaneAssignmentRequestDto[];
}

export class StartListController {
  public readonly router: Router;

  public constructor(
    private readonly configureStartListUseCase: ConfigureStartListUseCase,
    private readonly assignClassesToLanesUseCase: AssignClassesToLanesUseCase,
    private readonly scheduleParticipantsUseCase: ScheduleParticipantsUseCase,
    private readonly finalizeStartListUseCase: FinalizeStartListUseCase,
    private readonly getStartListDraftQueryHandler: GetStartListDraftQueryHandler
  ) {
    this.router = Router();
    this.router.get(
      '/events/:eventId/start-lists/:raceId/draft',
      this.handleGetStartListDraft.bind(this)
    );
    this.router.post(
      '/events/:eventId/start-lists/:raceId/settings',
      this.handleConfigureStartList.bind(this)
    );
    this.router.put(
      '/events/:eventId/start-lists/:raceId/lanes',
      this.handleAssignLanes.bind(this)
    );
    this.router.put(
      '/events/:eventId/start-lists/:raceId/participants',
      this.handleScheduleParticipants.bind(this)
    );
    this.router.post(
      '/events/:eventId/start-lists/:raceId/finalize',
      this.handleFinalizeStartList.bind(this)
    );
  }

  private async validateRequest<T extends object>(
    dtoClass: new () => T,
    payload: unknown
  ): Promise<T> {
    const dto = plainToInstance(dtoClass, payload);
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
      validationError: { target: false },
    });

    if (errors.length > 0) {
      throw new HttpValidationError(mapValidationErrors(errors));
    }

    return dto;
  }

  private presentDraftFromDomain(draft: StartListDraft) {
    const dto = toStartListDraftResponseDto(draft);
    return presentStartListDraft(dto);
  }

  private isNotFoundError(message: string): boolean {
    return [
      '指定されたスタートリストが見つかりません。',
      'スタートリストが未設定です。先に基本設定を完了してください。',
      'スタートリストが未設定です。',
    ].includes(message);
  }

  private handleCommandError(error: unknown, response: Response): void {
    if (error instanceof HttpValidationError) {
      response.status(400).json({ message: error.message, errors: error.details });
      return;
    }

    if (error instanceof Error) {
      if (this.isNotFoundError(error.message)) {
        response.status(404).json({ message: error.message });
        return;
      }

      response.status(400).json({ message: error.message });
      return;
    }

    response.status(500).json({ message: '不明なエラーが発生しました。' });
  }

  private async handleGetStartListDraft(
    request: Request,
    response: Response
  ): Promise<void> {
    try {
      const { eventId, raceId } = request.params;
      const query = GetStartListDraftQuery.forRace(eventId, raceId);
      const draft = await this.getStartListDraftQueryHandler.execute(query);
      const presented = presentStartListDraft(draft);
      response.status(200).json(presented);
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message === 'イベントIDを指定してください。' || error.message === 'レースIDを指定してください。') {
          response.status(400).json({ message: error.message });
          return;
        }

        if (error.message === '指定されたスタートリストが見つかりません。') {
          response.status(404).json({ message: error.message });
          return;
        }

        response.status(400).json({ message: error.message });
        return;
      }

      response.status(500).json({ message: '不明なエラーが発生しました。' });
    }
  }

  private async handleConfigureStartList(
    request: Request,
    response: Response
  ): Promise<void> {
    try {
      const dto = await this.validateRequest(ConfigureStartListRequestDto, request.body);
      const { eventId, raceId } = request.params;
      const command = ConfigureStartListCommand.from({
        eventId,
        raceId,
        startDateTime: dto.startDateTime,
        intervalSeconds: dto.intervalSeconds,
        laneCount: dto.laneCount,
      });
      const draft = await this.configureStartListUseCase.execute(command);
      const presented = this.presentDraftFromDomain(draft);
      response.status(201).json(presented);
    } catch (error: unknown) {
      this.handleCommandError(error, response);
    }
  }

  private async handleAssignLanes(
    request: Request,
    response: Response
  ): Promise<void> {
    try {
      const dto = await this.validateRequest(AssignLanesRequestDto, request.body);
      const { eventId, raceId } = request.params;
      const command = AssignClassesToLanesCommand.from({
        eventId,
        raceId,
        assignments: dto.assignments.map((assignment) => ({
          laneNumber: assignment.laneNumber,
          entryClassId: assignment.entryClassId,
        })),
      });
      const draft = await this.assignClassesToLanesUseCase.execute(command);
      const presented = this.presentDraftFromDomain(draft);
      response.status(200).json(presented);
    } catch (error: unknown) {
      this.handleCommandError(error, response);
    }
  }

  private async handleScheduleParticipants(
    request: Request,
    response: Response
  ): Promise<void> {
    try {
      const { eventId, raceId } = request.params;
      const command = ScheduleParticipantsCommand.from({ eventId, raceId });
      const draft = await this.scheduleParticipantsUseCase.execute(command);
      const presented = this.presentDraftFromDomain(draft);
      response.status(200).json(presented);
    } catch (error: unknown) {
      this.handleCommandError(error, response);
    }
  }

  private async handleFinalizeStartList(
    request: Request,
    response: Response
  ): Promise<void> {
    try {
      const { eventId, raceId } = request.params;
      const command = FinalizeStartListCommand.from({ eventId, raceId });
      const draft = await this.finalizeStartListUseCase.execute(command);
      const presented = this.presentDraftFromDomain(draft);
      response.status(200).json(presented);
    } catch (error: unknown) {
      this.handleCommandError(error, response);
    }
  }
}

export default StartListController;
