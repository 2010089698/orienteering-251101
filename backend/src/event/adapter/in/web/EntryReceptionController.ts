import 'reflect-metadata';
import { Request, Response, Router } from 'express';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
  validate
} from 'class-validator';
import { plainToInstance, Type } from 'class-transformer';

import RegisterEntryReceptionUseCase from '../../../../entryReception/application/command/RegisterEntryReceptionUseCase';
import RegisterEntryReceptionCommand from '../../../../entryReception/application/command/RegisterEntryReceptionCommand';
import GetEntryReceptionPreparationQuery from '../../../../entryReception/application/query/GetEntryReceptionPreparationQuery';
import GetEntryReceptionPreparationQueryHandler from '../../../../entryReception/application/query/GetEntryReceptionPreparationQueryHandler';
import EntryReceptionPreparationResponseDto, {
  RaceEntryReceptionDto,
  EntryReceptionClassDto as PreparationEntryReceptionClassDto
} from '../../../../entryReception/application/query/EntryReceptionPreparationResponseDto';
import HttpValidationError from './errors/HttpValidationError';
import { mapValidationErrors } from './support/validation';

export class EntryReceptionClassDto {
  @IsString({ message: 'エントリークラスIDは文字列で指定してください。' })
  @IsNotEmpty({ message: 'エントリークラスIDは必須です。' })
  public classId!: string;

  @IsString({ message: 'エントリークラス名は文字列で指定してください。' })
  @IsNotEmpty({ message: 'エントリークラス名は必須です。' })
  public name!: string;

  @IsOptional()
  @IsInt({ message: 'エントリークラスの定員は整数で指定してください。' })
  @Min(1, { message: 'エントリークラスの定員は1以上の整数で指定してください。' })
  public capacity?: number;
}

export class RegisterEntryReceptionRequestDto {
  @IsString({ message: 'レースIDは文字列で指定してください。' })
  @IsNotEmpty({ message: 'レースIDは必須です。' })
  public raceId!: string;

  @IsDateString({}, { message: '受付開始日時はISO8601形式で指定してください。' })
  public receptionStart!: string;

  @IsDateString({}, { message: '受付終了日時はISO8601形式で指定してください。' })
  public receptionEnd!: string;

  @IsArray({ message: 'エントリークラスは配列で指定してください。' })
  @ArrayNotEmpty({ message: 'エントリークラスを1件以上指定してください。' })
  @ValidateNested({ each: true })
  @Type(() => EntryReceptionClassDto)
  public entryClasses!: EntryReceptionClassDto[];
}

type EntryReceptionStatus = 'NOT_REGISTERED' | 'OPEN' | 'CLOSED';

function determineEntryReceptionStatus(
  raceReceptions: ReadonlyArray<RaceEntryReceptionDto>,
  referenceDate: Date
): EntryReceptionStatus {
  if (raceReceptions.length === 0) {
    return 'NOT_REGISTERED';
  }

  const now = referenceDate.getTime();
  const isOpen = raceReceptions.some((reception) => {
    const opensAt = reception.receptionStart.getTime();
    const closesAt = reception.receptionEnd.getTime();
    return opensAt <= now && now <= closesAt;
  });

  return isOpen ? 'OPEN' : 'CLOSED';
}

interface PresentedEntryReceptionClass {
  readonly classId: string;
  readonly name: string;
  readonly capacity?: number;
}

interface PresentedRaceEntryReception {
  readonly raceId: string;
  readonly receptionStart: string;
  readonly receptionEnd: string;
  readonly entryClasses: ReadonlyArray<PresentedEntryReceptionClass>;
}

interface PresentedEntryReceptionPreparationResponse {
  readonly eventId: string;
  readonly entryReceptionStatus: EntryReceptionStatus;
  readonly raceReceptions: ReadonlyArray<PresentedRaceEntryReception>;
}

function presentEntryReceptionPreparation(
  preparation: EntryReceptionPreparationResponseDto,
  referenceDate: Date
): PresentedEntryReceptionPreparationResponse {
  const raceReceptions: PresentedRaceEntryReception[] = preparation.raceReceptions.map((raceReception) => ({
    raceId: raceReception.raceId,
    receptionStart: raceReception.receptionStart.toISOString(),
    receptionEnd: raceReception.receptionEnd.toISOString(),
    entryClasses: raceReception.entryClasses.map((entryClass: PreparationEntryReceptionClassDto) => ({
      classId: entryClass.classId,
      name: entryClass.name,
      capacity: entryClass.capacity
    }))
  }));

  return {
    eventId: preparation.eventId,
    entryReceptionStatus: determineEntryReceptionStatus(preparation.raceReceptions, referenceDate),
    raceReceptions
  };
}

export class EntryReceptionController {
  public readonly router: Router;

  public constructor(
    private readonly registerEntryReceptionUseCase: RegisterEntryReceptionUseCase,
    private readonly entryReceptionPreparationQueryHandler: GetEntryReceptionPreparationQueryHandler
  ) {
    this.router = Router();
    this.router.get(
      '/events/:eventId/entry-receptions/create',
      this.handleGetEntryReceptionPreparation.bind(this)
    );
    this.router.post(
      '/events/:eventId/entry-receptions',
      this.handleRegisterEntryReception.bind(this)
    );
  }

  private async handleGetEntryReceptionPreparation(
    request: Request,
    response: Response
  ): Promise<void> {
    try {
      const { eventId } = request.params;
      const query = GetEntryReceptionPreparationQuery.forEvent(eventId);
      const preparation = await this.entryReceptionPreparationQueryHandler.execute(query);
      const presented = presentEntryReceptionPreparation(preparation, new Date());

      response.status(200).json(presented);
    } catch (error: unknown) {
      if (error instanceof Error) {
        const status = error.message === 'イベントIDを指定してください。' ? 400 : 404;
        response.status(status).json({ message: error.message });
        return;
      }

      response.status(500).json({ message: '不明なエラーが発生しました。' });
    }
  }

  private async handleRegisterEntryReception(
    request: Request,
    response: Response
  ): Promise<void> {
    try {
      const dto = plainToInstance(RegisterEntryReceptionRequestDto, request.body);
      const validationErrors = await validate(dto, {
        whitelist: true,
        forbidNonWhitelisted: true,
        validationError: { target: false }
      });

      if (validationErrors.length > 0) {
        throw new HttpValidationError(mapValidationErrors(validationErrors));
      }

      const { eventId } = request.params;
      const command = RegisterEntryReceptionCommand.from({
        eventId,
        raceId: dto.raceId,
        receptionStart: dto.receptionStart,
        receptionEnd: dto.receptionEnd,
        entryClasses: dto.entryClasses.map((entryClass) => ({
          classId: entryClass.classId,
          name: entryClass.name,
          capacity: entryClass.capacity
        }))
      });

      await this.registerEntryReceptionUseCase.execute(command);

      const query = GetEntryReceptionPreparationQuery.forEvent(eventId);
      const preparation = await this.entryReceptionPreparationQueryHandler.execute(query);
      const presented = presentEntryReceptionPreparation(preparation, new Date());

      response.status(201).json(presented);
    } catch (error: unknown) {
      if (error instanceof HttpValidationError) {
        response.status(400).json({
          message: error.message,
          errors: error.details
        });
        return;
      }

      if (error instanceof Error) {
        const status =
          error.message === '指定されたイベントが存在しません。' ||
          error.message === '指定されたイベントのエントリー受付情報が見つかりません。'
            ? 404
            : 400;

        response.status(status).json({
          message: error.message
        });
        return;
      }

      response.status(500).json({
        message: '不明なエラーが発生しました。'
      });
    }
  }
}

export default EntryReceptionController;
