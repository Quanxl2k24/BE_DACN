import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
@Injectable()
export class AppService {
  constructor(@InjectRedis() private readonly redis: Redis) {}
  async onModuleInit() {
    try {
      const pong = await this.redis.ping();
      console.log('✅ Redis connected:', pong);
    } catch (err) {
      console.error('❌ Redis connection failed:', err);
    }
  }
}
