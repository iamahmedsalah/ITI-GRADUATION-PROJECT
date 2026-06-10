type BackendResponseError = {
  success?: boolean
  message?: string
  errors?: Array<{
    field?: string
    message?: string
  }>
  lockUntil?: string | number
}

type Translate = (key: string, options?: Record<string, unknown>) => string

type BackendResponseMessageOptions = {
  fallbackKey: string
  translate: Translate
  locale?: string
}

export function getBackendResponseMessage(
  response: Response,
  data: BackendResponseError,
  { fallbackKey, translate, locale = 'en-US' }: BackendResponseMessageOptions,
) {
  const translateBackendMessage = (message?: string) => {
    if (!message) {
      return undefined
    }

    const normalizedMessage = message.trim().toLowerCase()

    const messageMap: Record<string, string> = {
      'validation failed.': 'auth.validationFailed',
      'please enter your admin email/username and password.': 'admin.validation.credentialsRequired',
      'invalid admin credentials.': 'admin.invalidCredentials',
      'this admin account is deactivated.': 'admin.accountDeactivated',
      'admin email not verified.': 'admin.verifyEmailRequired',
      'admin login successful.': 'admin.loginSuccess',
      'admin login failed.': 'admin.loginFailed',
      'invalid admin verification code.': 'admin.invalidVerificationCode',
      'admin email verified successfully.': 'admin.verifySuccess',
      'username is required.': 'validation.username.required',
      'username must be between 3 and 20 characters.': 'validation.username.range',
      'username must be between 3 and 24 characters.': 'validation.username.range',
      'username must include at least one letter.': 'validation.username.letter',
      'username can only contain letters, numbers, dots, underscores, and hyphens.': 'validation.username.pattern',
      'first name is required.': 'validation.firstName.required',
      'first name must be at least 2 characters.': 'validation.firstName.required',
      'first name must be at most 24 characters.': 'validation.firstName.max',
      'last name is required.': 'validation.lastName.required',
      'last name must be at least 2 characters.': 'validation.lastName.required',
      'last name must be at most 24 characters.': 'validation.lastName.max',
      'email is required.': 'validation.email.required',
      'please provide a valid email address.': 'validation.email.invalid',
      'please enter a valid email address.': 'validation.email.invalid',
      'email address before @ must include at least one letter.': 'validation.email.localPartLetter',
      'name must be at least 2 characters.': 'validation.contact.nameMin',
      'name must be at most 80 characters.': 'validation.contact.nameMax',
      'name contains invalid characters.': 'validation.contact.nameInvalid',
      'message must be at least 10 characters.': 'validation.contact.messageMin',
      'message must be at most 5000 characters.': 'validation.contact.messageMax',
      'message sent successfully.': 'contactPage.form.success',
      'too many contact requests, try again later.': 'auth.tooManyRequests',
      'password must be a string.': 'validation.password.required',
      'password must be at least 8 characters.': 'validation.password.min',
      'new password must be at least 8 characters long.': 'validation.password.min',
      'password must include uppercase, lowercase, number and symbol.': 'validation.password.requirements',
      'password must be at least 8 characters and include uppercase, lowercase, number, and special character.': 'validation.password.requirements',
      'verification code is required.': 'validation.verifyCode.required',
      'verification code must be 8 letters/numbers.': 'validation.verifyCode.pattern',
      'verification code must be 8 characters long.': 'validation.verifyCode.length',
      'please enter your password.': 'validation.password.required',
      'please enter your email address or username.': 'validation.identifier.min',
      'email is already registered.': 'auth.emailAlreadyRegistered',
      'username is already taken.': 'auth.usernameTaken',
      'an account already exists with this email.': 'auth.emailAlreadyRegistered',
      'an account already exists with this username.': 'auth.usernameTaken',
      'an account with this email or username exists but is deactivated. please contact support to reactivate it.': 'auth.accountDeactivated',
      'invalid email/username or password.': 'auth.invalidCredentials',
      'this account is deactivated. please contact support.': 'auth.accountDeactivated',
      'email not verified.': 'auth.verifyEmailRequired',
      'invalid verification code.': 'auth.invalidVerificationCode',
      'invalid or expired reset password link.': 'reset.invalidToken',
      'new password is required.': 'validation.password.required',
      'server auth configuration error.': 'auth.serverAuthConfigError',
      'a valid id is required.': 'admin.validation.idRequired',
      'id must be a valid 24-character hexadecimal value.': 'admin.validation.idHex',
      'page must be a number.': 'admin.validation.pageNumber',
      'page must be at least 1.': 'admin.validation.pageMin',
      'page value is too large.': 'admin.validation.pageMax',
      'limit must be a number.': 'admin.validation.limitNumber',
      'limit must be at least 1.': 'admin.validation.limitMin',
      'limit cannot be greater than 100.': 'admin.validation.limitMax',
      'deactivation reason must be at most 500 characters.': 'admin.validation.deactivationReasonMax',
      'provide at least one field to update: role, isverified, isactive, deactivationreason.': 'admin.validation.atLeastOneUserField',
      'provide at least one field to update.': 'admin.validation.atLeastOneField',
      'step key is required.': 'admin.validation.stepKeyRequired',
      'step key cannot be empty': 'admin.validation.stepKeyEmpty',
      'step key must be at most 50 characters': 'admin.validation.stepKeyMax',
      'step title is required.': 'admin.validation.stepTitleRequired',
      'step title must be at least 3 characters': 'admin.validation.stepTitleMin',
      'step title must be at most 120 characters': 'admin.validation.stepTitleMax',
      'step description must be at most 1000 characters': 'admin.validation.stepDescriptionMax',
      'resource title must be at most 120 characters': 'admin.validation.resourceTitleMax',
      'invalid resource url': 'admin.validation.resourceUrl',
      'step order must be a number.': 'admin.validation.stepOrderNumber',
      'step order cannot be negative': 'admin.validation.stepOrderMin',
      'estimated minutes must be a number.': 'admin.validation.estimatedMinutesNumber',
      'estimated minutes cannot be negative': 'admin.validation.estimatedMinutesMin',
      'estimated total minutes must be a number.': 'admin.validation.estimatedTotalMinutesNumber',
      'estimated total minutes cannot be negative': 'admin.validation.estimatedTotalMinutesMin',
      'slug must contain only lowercase letters, numbers, and hyphens': 'admin.validation.slugPattern',
      'duration must be a number.': 'admin.validation.durationNumber',
      'image must be a valid url or base64 data uri.': 'admin.validation.imageInput',
    }

    const translationKey = messageMap[normalizedMessage]

    if (translationKey) {
      return translate(translationKey)
    }

    return message
  }

  if (response.status === 423 && data.lockUntil) {
    const lockedUntil = new Date(data.lockUntil).toLocaleString(locale, {
      timeZone: 'Africa/Cairo',
      dateStyle: 'medium',
      timeStyle: 'short',
    })

    return translate('auth.accountLocked', { time: lockedUntil })
  }

  if (response.status === 429) {
    return translate('auth.tooManyRequests')
  }

  if (response.status === 400 || response.status === 409) {
    const validationMessage = translateBackendMessage(data.errors?.[0]?.message)

    if (validationMessage) {
      return validationMessage
    }

    const translatedMessage = translateBackendMessage(data.message)

    if (translatedMessage) {
      return translatedMessage
    }

    return translate('auth.validationFailed')
  }

  return translateBackendMessage(data.message) ?? translate(fallbackKey)
}

export type { BackendResponseError }
