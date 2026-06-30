import { WikiRepository } from '../repositories/WikiRepository.js';
import { LimitRepository } from '../repositories/LimitRepository.js';

export class WikiService {
  static async getTerms(searchQuery) {
    return WikiRepository.findTerms(searchQuery);
  }

  static async getGuides() {
    return WikiRepository.findGuides();
  }
}

export class LimitService {
  static async updateLimit(userId, termo, nivel, observacao) {
    if (!['verde', 'amarelo', 'vermelho'].includes(nivel)) {
      throw new Error('Nível de limite inválido.');
    }
    return LimitRepository.saveLimit(userId, termo, nivel, observacao);
  }

  static async getUserStats(userId) {
    return LimitRepository.getStats(userId);
  }

  static async getSinergia(userId, partnerId) {
    if (userId === partnerId) {
      throw new Error('Não é possível calcular compatibilidade consigo mesmo.');
    }
    return LimitRepository.compareLimits(userId, partnerId);
  }
}
