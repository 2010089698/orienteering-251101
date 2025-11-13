import 'reflect-metadata';
import { Request, Response, Router } from 'express';
import {
  IsArray,
  IsDateString,
  IsDefined,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
  validate
} from 'class-validator';
import { Transform, Type, plainToInstance } from 'class-transformer';

import ListPublicEventsQuery from '../../../application/query/participant/ListPublicEventsQuery';
import ListPublicEventsQueryHandler from '../../../application/query/participant/ListPublicEventsQueryHandler';
import PublicEventSearchCondition, {
  PublicEventStatus
} from '../../../application/query/participant/PublicEventSearchCondition';
import GetPublicEventDetailQuery from '../../../application/query/participant/GetPublicEventDetailQuery';
import GetPublicEventDetailQueryHandler from '../../../application/query/participant/GetPublicEventDetailQueryHandler';
import GetParticipantEntryOptionsQuery from '../../../../participantEntry/application/query/GetParticipantEntryOptionsQuery';
import GetParticipantEntryOptionsQueryHandler from '../../../../participantEntry/application/query/GetParticipantEntryOptionsQueryHandler';
import SubmitParticipantEntryCommand from '../../../../participantEntry/application/command/SubmitParticipantEntryCommand';
import SubmitParticipantEntryCommandHandler from '../../../../participantEntry/application/command/SubmitParticipantEntryCommandHandler';
import HttpValidationError from './errors/HttpValidationError';
import { presentEventSummary } from './presenters/EventSummaryPresenter';
import { presentPublicEventDetail } from './presenters/PublicEventDetailPresenter';
import { presentParticipantEntryOptions } from './presenters/ParticipantEntryPresenter';
import { mapValidationErrors } from './support/validation';

function toStatuses(value: unknown): string[] | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  const values = Array.isArray(value)
    ? value
    : String(value)
        .split(',')
        .map((item) => item.trim());

  const normalized = values
    .map((item) => String(item).trim())
    .filter((item) => item.length > 0);

  if (normalized.length === 0) {
    return undefined;
  }

  return normalized;
}

class ListPublicEventsRequestDto {
  @IsOptional()
  @IsDateString({}, { message: 'from はISO8601形式で指定してください。' })
  public from?: string;

  @IsOptional()
  @IsDateString({}, { message: 'to はISO8601形式で指定してください。' })
  public to?: string;

  @IsOptional()
  @Transform(({ value }) => toStatuses(value))
  @IsArray({ message: 'status は配列で指定してください。' })
  @IsIn(['upcoming', 'ongoing', 'past'], {
    each: true,
    message: 'status には upcoming, ongoing, past のいずれかを指定してください。'
  })
  public status?: string[];
}

class GetPublicEventDetailParamsDto {
  @IsString({ message: 'イベントIDは文字列で指定してください。' })
  @IsNotEmpty({ message: 'イベントIDは必須です。' })
  public eventId!: string;
}

class GetParticipantEntryOptionsQueryDto {
  @IsString({ message: 'レースIDは文字列で指定してください。' })
  @IsNotEmpty({ message: 'レースIDは必須です。' })
  public raceId!: string;
}

class RegisterParticipantEntryParticipantDto {
  @IsString({ message: '参加者氏名は文字列で指定してください。' })
  @IsNotEmpty({ message: '参加者氏名は必須です。' })
  public name!: string;

  @IsString({ message: '連絡先メールアドレスは文字列で指定してください。' })
  @IsEmail({}, { message: '連絡先メールアドレスはメールアドレス形式で指定してください。' })
  public email!: string;

  @IsOptional()
  @IsString({ message: '所属は文字列で指定してください。' })
  public organization?: string;

  @IsOptional()
  @IsString({ message: 'カード番号は文字列で指定してください。' })
  public cardNumber?: string;
}

class RegisterParticipantEntryRequestDto {
  @IsString({ message: 'イベントIDは文字列で指定してください。' })
  @IsNotEmpty({ message: 'イベントIDは必須です。' })
  public eventId!: string;

  @IsString({ message: 'レースIDは文字列で指定してください。' })
  @IsNotEmpty({ message: 'レースIDは必須です。' })
  public raceId!: string;

  @IsString({ message: 'エントリークラスIDは文字列で指定してください。' })
  @IsNotEmpty({ message: 'エントリークラスIDは必須です。' })
  public classId!: string;

  @IsDefined({ message: '参加者情報は必須です。' })
  @ValidateNested()
  @Type(() => RegisterParticipantEntryParticipantDto)
  public participant!: RegisterParticipantEntryParticipantDto;
}

export class PublicEventController {
  public readonly router: Router;

  public constructor(
    private readonly listPublicEventsQueryHandler: ListPublicEventsQueryHandler,
    private readonly getPublicEventDetailQueryHandler: GetPublicEventDetailQueryHandler,
    private readonly getParticipantEntryOptionsQueryHandler: GetParticipantEntryOptionsQueryHandler,
    private readonly submitParticipantEntryCommandHandler: SubmitParticipantEntryCommandHandler
  ) {
    this.router = Router();
    this.router.get('/public/events', this.handleListPublicEvents.bind(this));
    this.router.get(
      '/public/events/:eventId',
      this.handleGetPublicEventDetail.bind(this)
    );
    this.router.get(
      '/public/events/:eventId/entry-options',
      this.handleGetParticipantEntryOptions.bind(this)
    );
    this.router.post(
      '/public/events/:eventId/entries',
      this.handleSubmitParticipantEntry.bind(this)
    );
  }

  private async validateDtos(
    ...dtos: unknown[]
  ): Promise<void> {
    const validationResults = await Promise.all(
      dtos.map((dto) =>
        validate(dto as object, {
          whitelist: true,
          forbidNonWhitelisted: true,
          validationError: { target: false }
        })
      )
    );

    const errors = validationResults.flat();
    if (errors.length > 0) {
      throw new HttpValidationError(mapValidationErrors(errors));
    }
  }

  private async handleGetPublicEventDetail(
    request: Request,
    response: Response
  ): Promise<void> {
    try {
      const params = plainToInstance(GetPublicEventDetailParamsDto, request.params);
      const validationErrors = await validate(params, {
        whitelist: true,
        forbidNonWhitelisted: true,
        validationError: { target: false }
      });

      if (validationErrors.length > 0) {
        throw new HttpValidationError(mapValidationErrors(validationErrors));
      }

      const query = GetPublicEventDetailQuery.forEvent(params.eventId);
      const detail = await this.getPublicEventDetailQueryHandler.execute(query);

      response.status(200).json(presentPublicEventDetail(detail));
    } catch (error) {
      if (error instanceof HttpValidationError) {
        response.status(400).json({
          message: error.message,
          errors: error.details
        });
        return;
      }

      if (error instanceof Error) {
        if (error.message === 'イベントIDを指定してください。') {
          response.status(400).json({
            message: error.message
          });
          return;
        }

        if (error.message === '指定されたイベントが見つかりませんでした。') {
          response.status(404).json({
            message: error.message
          });
          return;
        }

        response.status(400).json({
          message: error.message
        });
        return;
      }

      response.status(500).json({
        message: '不明なエラーが発生しました。'
      });
    }
  }

  private async handleListPublicEvents(
    request: Request,
    response: Response
  ): Promise<void> {
    try {
      const dto = plainToInstance(ListPublicEventsRequestDto, request.query);
      const validationErrors = await validate(dto, {
        whitelist: true,
        forbidNonWhitelisted: true,
        validationError: { target: false }
      });

      if (validationErrors.length > 0) {
        throw new HttpValidationError(mapValidationErrors(validationErrors));
      }

      const condition = this.toSearchCondition(dto);
      const query = ListPublicEventsQuery.create(condition);
      const summaries = await this.listPublicEventsQueryHandler.execute(query);

      response.status(200).json(summaries.map((summary) => presentEventSummary(summary)));
    } catch (error) {
      if (error instanceof HttpValidationError) {
        response.status(400).json({
          message: error.message,
          errors: error.details
        });
        return;
      }

      if (error instanceof Error) {
        response.status(400).json({
          message: error.message
        });
        return;
      }

      response.status(500).json({
        message: '不明なエラーが発生しました。'
      });
    }
  }

  private async handleGetParticipantEntryOptions(
    request: Request,
    response: Response
  ): Promise<void> {
    try {
      const params = plainToInstance(GetPublicEventDetailParamsDto, request.params);
      const queryDto = plainToInstance(GetParticipantEntryOptionsQueryDto, request.query);

      await this.validateDtos(params, queryDto);

      const detailQuery = GetPublicEventDetailQuery.forEvent(params.eventId);
      const eventDetail = await this.getPublicEventDetailQueryHandler.execute(detailQuery);

      const optionsQuery = new GetParticipantEntryOptionsQuery(params.eventId, queryDto.raceId);
      const entryOptions = await this.getParticipantEntryOptionsQueryHandler.execute(optionsQuery);

      const presented = presentParticipantEntryOptions(eventDetail, entryOptions, new Date());

      response.status(200).json(presented);
    } catch (error) {
      if (error instanceof HttpValidationError) {
        response.status(400).json({
          message: error.message,
          errors: error.details
        });
        return;
      }

      if (error instanceof Error) {
        if (error.message === '指定されたイベントが見つかりませんでした。') {
          response.status(404).json({ message: error.message });
          return;
        }

        if (error.message === '指定されたレースの受付情報が見つかりません。') {
          response.status(404).json({ message: error.message });
          return;
        }

        response.status(400).json({ message: error.message });
        return;
      }

      response.status(500).json({ message: '不明なエラーが発生しました。' });
    }
  }

  private async handleSubmitParticipantEntry(
    request: Request,
    response: Response
  ): Promise<void> {
    try {
      const params = plainToInstance(GetPublicEventDetailParamsDto, request.params);
      const dto = plainToInstance(RegisterParticipantEntryRequestDto, request.body);

      await this.validateDtos(params, dto);

      if (dto.eventId !== params.eventId) {
        throw new HttpValidationError([
          'パスパラメータのイベントIDとリクエスト本文のイベントIDが一致しません。'
        ]);
      }

      const command = new SubmitParticipantEntryCommand(
        params.eventId,
        dto.raceId,
        dto.classId,
        dto.participant.name,
        dto.participant.email
      );

      await this.submitParticipantEntryCommandHandler.execute(command);

      response.status(202).json({ message: 'エントリーを受け付けました。' });
    } catch (error) {
      if (error instanceof HttpValidationError) {
        response.status(400).json({
          message: error.message,
          errors: error.details
        });
        return;
      }

      if (error instanceof Error) {
        if (error.message === '指定されたレースでは参加者受付を実施していません。') {
          response.status(404).json({ message: error.message });
          return;
        }

        if (error.message === '指定されたイベントが見つかりませんでした。') {
          response.status(404).json({ message: error.message });
          return;
        }

        response.status(400).json({ message: error.message });
        return;
      }

      response.status(500).json({ message: '不明なエラーが発生しました。' });
    }
  }

  private toSearchCondition(dto: ListPublicEventsRequestDto): PublicEventSearchCondition {
    const from = dto.from ? new Date(dto.from) : undefined;
    const to = dto.to ? new Date(dto.to) : undefined;
    const statuses = (dto.status ?? []) as PublicEventStatus[];

    return PublicEventSearchCondition.create({
      startDateFrom: from,
      startDateTo: to,
      statuses,
      referenceDate: new Date()
    });
  }
}

export default PublicEventController;
