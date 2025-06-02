export class ColisStateMachine {
  private static transitions: Record<string, string[]> = {
    stored: ['in_transit'],
    in_transit: ['delivered', 'lost', 'stored'],
    delivered: [],
    lost: ['stored'],
  }

  /**
   * Vérifier si une transition est valide
   */
  static canTransition(from: string, to: string): boolean {
    return this.transitions[from]?.includes(to) || false
  }

  /**
   * Valider une transition et lever une exception si invalide
   */
  static validateTransition(from: string, to: string): void {
    if (!this.canTransition(from, to)) {
      throw new Error(`Transition invalide: ${from} → ${to}`)
    }
  }

  /**
   * Obtenir les transitions possibles depuis un état
   */
  static getAvailableTransitions(from: string): string[] {
    return this.transitions[from] || []
  }
}
