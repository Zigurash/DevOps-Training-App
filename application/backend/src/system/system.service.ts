import { Injectable } from '@nestjs/common';
import * as os from 'os';

@Injectable()
export class SystemService {
  getInfo() {
    const memory = process.memoryUsage();
    const cpus = os.cpus();

    return {
      hostname: os.hostname(),
      platform: os.platform(),
      architecture: os.arch(),
      nodeVersion: process.version,
      processId: process.pid,
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '1.0.0',
      memory: {
        rss: memory.rss,
        heapUsed: memory.heapUsed,
        heapTotal: memory.heapTotal,
        external: memory.external,
      },
      cpu: {
        cores: cpus.length,
        model: cpus[0]?.model ?? 'unknown',
        loadAverage: os.loadavg(),
      },
    };
  }
}
