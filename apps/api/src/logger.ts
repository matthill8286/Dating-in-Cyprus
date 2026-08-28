export const PII_REDACT_PATHS = [
  'email',
  'phone',
  'name',
  'chatBody',
  'photoUrl',
  '*.email',
  '*.phone',
  '*.name',
  '*.chatBody',
  '*.photoUrl',
  'req.body.email',
  'req.body.phone',
  'req.body.name',
  'req.body.chatBody',
  'req.body.photoUrl',
];

export const loggerRedact = {
  paths: PII_REDACT_PATHS,
  censor: '[redacted]',
};
