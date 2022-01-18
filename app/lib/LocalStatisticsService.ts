export interface AnswerLog {
  word: string;
  time: number;
}

export interface LocalStatistics {
  logs: AnswerLog[];
}

export const initialLocalStatics: LocalStatistics = { logs: [] };

export class LocalStatisticsService {
  constructor() {
  }

  getLocalStatistics(): LocalStatistics {
    const result = JSON.parse(localStorage.getItem('listening-game-local-statistics') ?? JSON.stringify(initialLocalStatics));
    return result;
  }

  setLocalStatistics(value: LocalStatistics) {
    localStorage.setItem('listening-game-local-statistics', JSON.stringify(value));
  }

  getAverageTime(): number | undefined {
    const data = this.getLocalStatistics();
    const filtered = data.logs.filter((l) => l.time < 30000).map((item) => item.time);
    if (filtered.length === 0) return undefined;
    return filtered.reduce((x, y) => x + y, 0) / filtered.length;
  }

  getLogsCount(): number {
    return this.getLocalStatistics().logs.length;
  }

  saveAnswerLog(value: AnswerLog) {
    const current = this.getLocalStatistics();
    current.logs.push(value);
    this.setLocalStatistics(current);
  }

  clearAnswerLog() {
    const current = this.getLocalStatistics();
    current.logs = [];
    this.setLocalStatistics(current);
  }
}