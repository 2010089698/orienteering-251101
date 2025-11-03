import 'reflect-metadata';
import { Request, Response, Router } from 'express';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  validate
} from 'class-validator';
import { Transform, plainToInstance } from 'class-transformer';

import ListPublicEventsQuery from '../../../application/query/participant/ListPublicEventsQuery';
import ListPublicEventsQueryHandler from '../../../application/query/participant/ListPublicEventsQueryHandler';
import PublicEventSearchCondition, {
  PublicEventStatus
} from '../../../application/query/participant/PublicEventSearchCondition';
import GetPublicEventDetailQuery from '../../../application/query/participant/GetPublicEventDetailQuery';
import GetPublicEventDetailQueryHandler from '../../../application/query/participant/GetPublicEventDetailQueryHandler';
import HttpValidationError from './errors/HttpValidationError';
import { presentEventSummary } from './presenters/EventSummaryPresenter';
import { presentPublicEventDetail } from './presenters/PublicEventDetailPresenter';
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

export class PublicEventController {
  public readonly router: Router;

  public constructor(
    private readonly listPublicEventsQueryHandler: ListPublicEventsQueryHandler,
    private readonly getPublicEventDetailQueryHandler: GetPublicEventDetailQueryHandler
  ) {
    this.router = Router();
    this.router.get('/public/events', this.handleListPublicEvents.bind(this));
    this.router.get(
      '/public/events/:eventId',
      this.handleGetPublicEventDetail.bind(this)
    );
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
