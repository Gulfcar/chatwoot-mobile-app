export const URL_TYPE = 'https://';

export const API_URL = 'api/v1/';

// Set EXPO_PUBLIC_HELP_CENTER_URL to your own docs; the Settings row is
// hidden when it is empty rather than falling back to a vendor URL.
export const HELP_URL = process.env.EXPO_PUBLIC_HELP_CENTER_URL || '';

export const GRAVATAR_URL = 'https://www.gravatar.com/avatar/';

export const REPLY_POLICY = {
  FACEBOOK: 'https://developers.facebook.com/docs/messenger-platform/policy/policy-overview/',
  TWILIO_WHATSAPP:
    'https://www.twilio.com/docs/whatsapp/tutorial/send-whatsapp-notification-messages-templates#sending-non-template-messages-within-a-24-hour-session',
};
