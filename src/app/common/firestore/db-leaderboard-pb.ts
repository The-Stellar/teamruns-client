import { Timer } from "../run/timer";
import { DbPb } from "./db-pb";
import { DbRunUserContent } from "./db-run-user-content";
import { DbTask } from "./db-task";
import { DbUsersCollection } from "./db-users-collection";

export class DbLeaderboardPb {
    id?: string; //undefined for DbPbs that extends this 
    version: string;
    date: number;
    userIds: string[] = [];
    userContent: DbRunUserContent[] = [];
    tasks: DbTask[];
    endTimeMs: number;
    playbackAvailable: boolean;

    //frontend values
    dateFrontend?: Date;
    endTimeFrontend?: string;
    userDisplayContent?: UserDisplayContent[];
    hasLocalUser?: boolean;

    constructor() {
    }

    static convertToFromPb(run: DbPb): DbLeaderboardPb {
        let pb = new DbLeaderboardPb();

        pb.id = run.id;
        pb.version = run.version;
        pb.date = run.date;
        if (run.userIds instanceof Map)
            pb.userIds = Array.from(run.userIds.keys());
        else {
            pb.userIds = Array.from(new Map(Object.entries(run.userIds)).keys());
        }
        
        pb.userContent = run.userContent;
        pb.tasks = run.tasks;
        pb.endTimeMs = run.endTimeMs;
        pb.playbackAvailable = run.playbackAvailable;
        return pb;
    }

    fillFrontendValues(usersCollection: DbUsersCollection, userId: string) {
            
        this.endTimeFrontend = this.endTimeMs === 0 ? "DNF" : Timer.msToTimeFormat(this.endTimeMs, true, true);
        this.hasLocalUser = this.userIds.find(x => x === userId) !== undefined;
        
        if (this.date)
            this.dateFrontend = new Date(this.date);
        
        this.userIds.forEach((id, index) => {
            let username = usersCollection?.users.find(x => x.id === id)?.name ?? "Unknown";
            let content = this.userContent.find(x => x.userId === id) as UserDisplayContent;
            if (content && content.userId)
                content.name = username;
            else
                content = new UserDisplayContent(id, username);

            if (!this.userDisplayContent)
                this.userDisplayContent = [];
            this.userDisplayContent.push(content);
        });

        return this;
    }

    clearFrontendValues() {
        this.dateFrontend = undefined;
        this.endTimeFrontend = undefined;
        this.userDisplayContent = undefined;
        this.hasLocalUser = undefined;
    }
}

export class UserDisplayContent extends DbRunUserContent {
    name: string;

    constructor(id: string, name: string) {
        super();
        this.userId = id;
        this.name = name;
    }
}