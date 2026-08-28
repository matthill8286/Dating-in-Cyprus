export const PII_REDACT_PATHS = [
  'email',
  'phone',
  'mobile',
  'name',
  'password',
  'chatBody',
  'photoUrl',
  '*.email',
  '*.phone',
  '*.mobile',
  '*.name',
  '*.password',
  '*.chatBody',
  '*.photoUrl',
  'req.body.email',
  'req.body.phone',
  'req.body.mobile',
  'req.body.name',
  'req.body.password',
  'req.body.chatBody',
  'req.body.photoUrl',
];

export const loggerRedact = {
  paths: PII_REDACT_PATHS,
  censor: '[redacted]',
};
