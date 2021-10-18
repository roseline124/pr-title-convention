export enum ErrorType {
  TYPE_ERROR = 'TYPE_ERROR',
  SCOPE_ERROR = 'SCOPE_ERROR',
  SUBJECT_ERROR = 'SUBJECT_ERROR',
  SUBJECT_NOT_FOUND_ERROR = 'SUBJECT_NOT_FOUND_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  SINGLE_COMMIT_ERROR = 'SINGLE_COMMIT_ERROR',
  // BRANCH_NAME_ERROR = 'BRANCH_NAME_ERROR', // @todo: implement later
}

type ErrorInfo = {
  errorWord?: string;
  availableWords?: string[];
  [field: string]: any;
};

export class ValidationError extends Error {
  constructor(message: string, public type = ErrorType.UNKNOWN_ERROR, public info?: ErrorInfo) {
    super(message);
  }
}
