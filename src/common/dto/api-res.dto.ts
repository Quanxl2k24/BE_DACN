import { Exclude, Expose } from 'class-transformer';

export class ApiResponseDto<T = any> {
  success!: boolean;
  statusCode!: number;
  message!: string;
  data?: T;
  errors?: any;
  timestamp!: string;
  path?: string;

  constructor(partial: Partial<ApiResponseDto<T>>) {
    Object.assign(this, partial);
    this.timestamp = this.timestamp || new Date().toISOString();
  }
}
