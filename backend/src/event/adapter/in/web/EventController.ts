import 'reflect-metadata';
import { Request, Response, Router } from 'express';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
  validate
} from 'class-validator';
import { plainToInstance, Type } from 'class-transformer';
import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments, Validate } from 'class-validator';
import type {
  CreateEventRequest,
  RaceScheduleRequest
} from '@shared/event/contracts/CreateEventContract';
import { collectCreateEventDateIssues } from '@shared/event/contracts/CreateEventContract';
import CreateEventUseCase from '../../../application/command/CreateEventUseCase';
import { CreateEventCommand, RaceScheduleCommandDto } from '../../../application/command/CreateEventCommand';
import GetEventCreationDefaultsQuery from '../../../application/query/GetEventCreationDefaultsQuery';
import GetEventCreationDefaultsQueryHandler from '../../../application/query/GetEventCreationDefaultsQueryHandler';
import GetOrganizerEventDetailQuery from '../../../application/query/GetOrganizerEventDetailQuery';
import GetOrganizerEventDetailQueryHandler from '../../../application/query/GetOrganizerEventDetailQueryHandler';
import ListOrganizerEventsQuery from '../../../application/query/ListOrganizerEventsQuery';
import ListOrganizerEventsQueryHandler from '../../../application/query/ListOrganizerEventsQueryHandler';
import RaceSchedule from '../../../domain/RaceSchedule';
import HttpValidationError from './errors/HttpValidationError';
import { presentEventSummary } from './presenters/EventSummaryPresenter';
import { formatDateOnly } from './support/date';
import { mapValidationErrors } from './support/validation';

class RaceScheduleRequestDto implements RaceScheduleRequest {
  @IsString({ message: 'レース名は文字列で指定してください。' })
  @IsNotEmpty({ message: 'レース名は必須です。' })
  public name!: string;

  @IsDateString({}, { message: 'レース日程はISO8601形式で指定してください。' })
  public date!: string;
}

@ValidatorConstraint({ name: 'EventDateConsistency', async: false })
class EventDateConsistencyValidator implements ValidatorConstraintInterface {
  public validate(_: unknown, args: ValidationArguments): boolean {
    const dto = args.object as CreateEventRequestDto;
    return collectCreateEventDateIssues(dto).length === 0;
  }

  public defaultMessage(args: ValidationArguments): string {
    const dto = args.object as CreateEventRequestDto;
    const [firstIssue] = collectCreateEventDateIssues(dto);
    if (firstIssue) {
      return firstIssue.message;
    }

    return 'イベント終了日は開始日以降の日付を指定してください。';
  }
}

class CreateEventRequestDto implements CreateEventRequest {
  @IsString({ message: 'イベントIDは文字列で指定してください。' })
  @IsNotEmpty({ message: 'イベントIDは必須です。' })
  public eventId!: string;

  @IsString({ message: 'イベント名は文字列で指定してください。' })
  @IsNotEmpty({ message: 'イベント名は必須です。' })
  public eventName!: string;

  @IsDateString({}, { message: 'イベント開始日はISO8601形式で指定してください。' })
  public startDate!: string;

  @IsOptional()
  @IsDateString({}, { message: 'イベント終了日はISO8601形式で指定してください。' })
  public endDate?: string;

  @IsArray({ message: 'レース日程は配列で指定してください。' })
  @ArrayNotEmpty({ message: 'レース日程を1件以上指定してください。' })
  @ValidateNested({ each: true })
  @Type(() => RaceScheduleRequestDto)
  public raceSchedules!: RaceScheduleRequestDto[];

  @Validate(EventDateConsistencyValidator)
  public get dates(): boolean {
    return true;
  }
}

export class EventController {
  public readonly router: Router;

  constructor(
    private readonly createEventUseCase: CreateEventUseCase,
    private readonly defaultsQueryHandler: GetEventCreationDefaultsQueryHandler,
    private readonly listEventsQueryHandler: ListOrganizerEventsQueryHandler,
    private readonly eventDetailQueryHandler: GetOrganizerEventDetailQueryHandler
  ) {
    this.router = Router();
    this.router.get('/events/defaults', this.handleGetDefaults.bind(this));
    this.router.get('/events/create/defaults', this.handleLegacyDefaults.bind(this));
    this.router.get('/events', this.handleListEvents.bind(this));
    this.router.get('/events/:eventId', this.handleGetEventDetail.bind(this));
    this.router.post('/events', this.handleCreateEvent.bind(this));
  }

  private async handleGetEventDetail(request: Request, response: Response): Promise<void> {
    try {
      const { eventId } = request.params;
      const query = GetOrganizerEventDetailQuery.forEvent(eventId);
      const detail = await this.eventDetailQueryHandler.execute(query);

      response.status(200).json(detail);
    } catch (error) {
      if (error instanceof Error) {
        const status = error.message === 'イベントIDを指定してください。' ? 400 : 404;
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

  private async handleListEvents(request: Request, response: Response): Promise<void> {
    try {
      const organizerId = this.resolveOrganizerId(request.query.organizerId);
      const query = ListOrganizerEventsQuery.forOrganizer(organizerId);
      const summaries = await this.listEventsQueryHandler.execute(query);

      response.status(200).json(summaries.map((summary) => presentEventSummary(summary)));
    } catch (error) {
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

  private async handleCreateEvent(request: Request, response: Response): Promise<void> {
    try {
      const dto = plainToInstance(CreateEventRequestDto, request.body);
      const validationErrors = await validate(dto, {
        whitelist: true,
        forbidNonWhitelisted: true,
        validationError: { target: false }
      });

      if (validationErrors.length > 0) {
        throw new HttpValidationError(mapValidationErrors(validationErrors));
      }

      const command = this.toCommand(dto);
      const event = await this.createEventUseCase.execute(command);

      response.status(201).json({
        eventId: event.eventIdentifier,
        eventName: event.displayName,
        startDate: formatDateOnly(event.eventDuration.startDate),
        endDate: formatDateOnly(event.eventDuration.endDate),
        isMultiDayEvent: event.isMultiDayEvent,
        isMultiRaceEvent: event.isMultiRaceEvent,
        raceSchedules: event.raceSchedules.map((schedule: RaceSchedule) => ({
          name: schedule.name,
          date: formatDateOnly(schedule.date)
        }))
      });
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

  private async handleGetDefaults(_: Request, response: Response): Promise<void> {
    const query = GetEventCreationDefaultsQuery.create();
    const defaults = await this.defaultsQueryHandler.execute(query);
    response.status(200).json(defaults);
  }

  private handleLegacyDefaults(_: Request, response: Response): void {
    response.redirect(308, '/events/defaults');
  }

  private toCommand(dto: CreateEventRequestDto): CreateEventCommand {
    const races: RaceScheduleCommandDto[] = dto.raceSchedules.map((schedule) => ({
      name: schedule.name,
      date: schedule.date
    }));

    return CreateEventCommand.from({
      eventId: dto.eventId,
      eventName: dto.eventName,
      startDate: dto.startDate,
      endDate: dto.endDate,
      raceSchedules: races
    });
  }

  private resolveOrganizerId(raw: unknown): string {
    if (Array.isArray(raw)) {
      return String(raw[0] ?? '').trim();
    }

    if (raw === undefined || raw === null) {
      return '';
    }

    return String(raw).trim();
  }

}

export default EventController;
