import { MailerService } from '@nestjs-modules/mailer';

import { Injectable } from '@nestjs/common';
import {
  LivestreamInstantEmailContext,
  LivestreamScheduleEmailContext,
  MeetingEmailContext,
  MeetingRecordEmailContext,
} from './mail-context.interface';

@Injectable()
export class MailService {
  constructor(private readonly mailService: MailerService) {}

  async sendEmailInvitationMeeting(data: MeetingEmailContext) {
    await this.mailService.sendMail({
      to: data.to,
      subject: `Meeting Invitation: ${data.meetingName} @ ${data.startDate} ${data.startTime} - ${data.endDate} ${data.endTime} (UTC +0)`,
      template: data.description
        ? './meeting-schedule-invitation-email-with-description.html'
        : './meeting-schedule-invitation-email.html',
      context: {
        ...data,
        logo: '',
      },
    });
  }

  async sendEmailUpdateMeeting(data: MeetingEmailContext) {
    await this.mailService.sendMail({
      to: data.to,
      subject: `Meeting Update: ${data.meetingName} @ ${data.startDate} ${data.startTime} - ${data.endDate} ${data.endTime} (UTC +0)`,
      template: data.description
        ? './meeting-schedule-update-email-with-description.html'
        : './meeting-schedule-update-email.html',
      context: {
        ...data,
        logo: '',
      },
    });
  }

  async sendEmailCancelMeeting(data: MeetingEmailContext) {
    await this.mailService.sendMail({
      to: data.to,
      subject: `Cancelled Meeting: ${data.meetingName} @ ${data.startDate} ${data.startTime} - ${data.endDate} ${data.endTime} (UTC +0)`,
      template: data.description
        ? './meeting-schedule-cancellation-email-with-description.html'
        : './meeting-schedule-cancellation-email.html',
      context: {
        ...data,
        logo: '',
      },
    });
  }

  async sendEmailInvitationLivestreamSchedule(
    data: LivestreamScheduleEmailContext,
  ) {
    await this.mailService.sendMail({
      to: data.to,
      subject: `Livestream Invitation: ${data.livestreamName} @ ${data.date} ${data.startTime} (UTC +0)`,
      template: data.description
        ? './livestream-schedule-invitation-email-with-description.html'
        : './livestream-schedule-invitation-email.html',
      context: {
        ...data,
        logo: '',
      },
    });
  }

  async sendEmailUpdateLivestreamSchedule(
    data: LivestreamScheduleEmailContext,
  ) {
    await this.mailService.sendMail({
      to: data.to,
      subject: `Livestream Update: ${data.livestreamName} @ ${data.date} ${data.startTime} (UTC +0)`,
      template: data.description
        ? './livestream-schedule-update-email-with-description.html'
        : './livestream-schedule-update-email.html',
      context: {
        ...data,
        logo: '',
      },
    });
  }

  async sendEmailCancelLivestreamSchedule(
    data: LivestreamScheduleEmailContext,
  ) {
    await this.mailService.sendMail({
      to: data.to,
      subject: `Cancelled Livestream: ${data.livestreamName} @ ${data.date} ${data.startTime} (UTC +0)`,
      template: data.description
        ? './livestream-schedule-cancellation-email-with-description.html'
        : './livestream-schedule-cancellation-email.html',
      context: {
        ...data,
        logo: '',
      },
    });
  }

  async sendEmailInvitationLivestreamInstant(
    data: LivestreamInstantEmailContext,
  ) {
    await this.mailService.sendMail({
      to: data.to,
      subject: `Livestream Invitation: ${data.livestreamName}`,
      template: data.description
        ? './livestream-instant-invitation-email-with-description.html'
        : './livestream-instant-invitation-email.html',
      context: {
        ...data,
        logo: '',
      },
    });
  }

  async sendEmailMeetingRecordProcessing(data: MeetingRecordEmailContext) {
    await this.mailService.sendMail({
      to: data.to,
      subject: data.meetingName
        ? `Meeting data from ${data.meetingName} on ${data.date} (UTC +0)`
        : `Meeting data on ${data.date} (UTC +0)`,
      template: './meeting-record-processing-email.html',
      context: {
        ...data,
        logo: '',
      },
    });
  }

  async sendEmailMeetingRecordFinish(data: MeetingRecordEmailContext) {
    await this.mailService.sendMail({
      to: data.to,
      subject: data.meetingName
        ? `Meeting recording of ${data.meetingName} on ${data.date} (UTC +0)`
        : `Meeting recording on on ${data.date} (UTC +0)`,
      template: data.meetingName
        ? './meeting-record-finished-email-with-name.html'
        : './meeting-record-finished-email.html',
      context: {
        ...data,
        logo: '',
      },
    });
  }
}
