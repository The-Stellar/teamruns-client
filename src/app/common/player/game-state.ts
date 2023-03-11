export class GameState {
    currentLevel: string;
    onZoomer: boolean;
    cellCount: number;
    sharedTasks: any;

    constructor() {
        this.currentLevel = "";
        this.onZoomer = false;
        this.cellCount = 0;
        this.sharedTasks = null;
    }

    hasSharedTaskChange(state: GameState): boolean {
        return JSON.stringify(state.sharedTasks) !== JSON.stringify(this.sharedTasks);
    }

    hasPlayerStateChange(state: GameState): boolean {
        return this.currentLevel != state.currentLevel 
        || this.onZoomer != state.onZoomer;
    }
}