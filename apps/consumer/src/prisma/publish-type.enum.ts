import { registerEnumType } from '@nestjs/graphql';

export enum Publish {
  YES = 'YES',
  NO = 'NO',
}

registerEnumType(Publish, { name: 'Publish', description: undefined });

export enum SignMethod {
  APPLE = 'APPLE',
  GOOGLE = 'GOOGLE',
  FACEBOOK = 'FACEBOOK',
}

registerEnumType(SignMethod, {
  name: 'SignMethod',
  description: 'Sign Method',
});
