import { Component, HostListener, NgZone, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Task } from '../../common/opengoal/task';
import { UserService } from '../../services/user.service';
import pkg from 'app/package.json';
import { FireStoreService } from '../../services/fire-store.service';
import { LocalPlayerData } from '../../common/user/local-player-data';
import { PlayerState } from '../../common/player/player-state';
import { RunState } from '../../common/run/run-state';
import { RunHandler } from '../../common/run/run-handler';
import { EventType } from '../../common/peer/event-type';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmComponent } from '../../dialogs/confirm/confirm.component';
import { UserBase } from '../../common/user/user';
import { GameTaskLevelTime } from '../../common/opengoal/game-task';
import { TaskStatus } from '../../common/opengoal/task-status';
import { AddPlayerComponent } from '../../dialogs/add-player/add-player.component';
import { OG } from '../../common/opengoal/og';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-run',
  templateUrl: './run.component.html',
  styleUrls: ['./run.component.scss']
})
export class RunComponent implements OnDestroy {
  
  //variables for frontend checks
  buildVersion: string = pkg.version;
  playerState = PlayerState;
  runState = RunState;

  //component variables
  mainLocalPlayer: LocalPlayerData | undefined = undefined;
  runHandler: RunHandler;

  runSetupSubscription: Subscription;

  editingTeamId: number | null = null;

  constructor(public _user: UserService, private firestoreService: FireStoreService, private route: ActivatedRoute, private zone: NgZone, private dialog: MatDialog, private router: Router) {
    

    //on parameter get (was swapped from route as electon had issues getting routes containing more than one (/) path)
    this.route.queryParamMap.subscribe((params) => {
      let runId = params.get('id');

      this.runHandler = new RunHandler(runId ?? undefined, firestoreService, _user, dialog, zone);
      this.runSetupSubscription = this.runHandler.runSetupCompleteSubject.subscribe(runData => {
        if (!runData || !this.runHandler.run || this.mainLocalPlayer) return;
        
        this.mainLocalPlayer = new LocalPlayerData(this._user.user, OG.mainPort, this.runHandler.run, this.zone);
        this.runHandler.setupLocalMainPlayer(this.mainLocalPlayer);
      });
    });
  }

  addLocalPlayer(teamId: number) {
    const dialogRef = this.dialog.open(AddPlayerComponent, { data: this.runHandler.run });
    const dialogSubscription = dialogRef.afterClosed().subscribe((player: LocalPlayerData | undefined) => {
      dialogSubscription.unsubscribe();

      if (player && this.runHandler.run)
        this.runHandler.setupLocalSecondaryPlayer(player, teamId);
    });
  }

  forfeit() {
    if (!this.runHandler.run) return;

    const dialogRef = this.dialog.open(ConfirmComponent, { data: "Are you sure you want to forfeit the run?" });
    const dialogSubscription = dialogRef.afterClosed().subscribe(confirmed => {
      dialogSubscription.unsubscribe();
      if (confirmed) {
        this._user.localUsers.forEach(localPlayer => {
          localPlayer.state = PlayerState.Forfeit;
          const task = new GameTaskLevelTime(Task.forfeit, localPlayer.user.getUserBaseWithDisplayName(), this.runHandler.run?.getPlayer(localPlayer.user.id)?.currentLevel ?? "", this.runHandler.run!.getTimerShortenedFormat(), TaskStatus.unknown);
          this.runHandler.sendEvent(EventType.EndPlayerRun, localPlayer.user.id, task);
        });
      }
    });
  }

  toggleReady() {
    this._user.localUsers.forEach(localPlayer => {
      localPlayer.state = localPlayer.state === PlayerState.Ready ? PlayerState.Neutral : PlayerState.Ready;
      this.runHandler.sendEvent(EventType.Ready, localPlayer.user.id, localPlayer.state);
    });
  }

  toggleReset() {
    this._user.localUsers.forEach(localPlayer => {
      localPlayer.state = localPlayer.state === PlayerState.WantsToReset ? localPlayer.socketHandler.localTeam?.splits.some(x => x.obtainedById === localPlayer.user.id && x.gameTask === Task.forfeit) ? PlayerState.Forfeit : PlayerState.Neutral : PlayerState.WantsToReset;
      this.runHandler.sendEvent(EventType.ToggleReset, localPlayer.user.id, localPlayer.state);
    });
  }

  switchTeam(teamId: number) {
    if (!this.mainLocalPlayer) return;
    let userId = this.mainLocalPlayer.user.id;

    let localPlayer = this._user.localUsers.find(x => x.user.id === userId);
    if (!localPlayer) return;

    if (this.runHandler.run?.timer.runState !== RunState.Waiting && this.runHandler.isSpectatorOrNull(userId)) return;
    this.runHandler.sendEvent(EventType.ChangeTeam, userId, teamId);
    localPlayer.updateTeam(this.runHandler.run?.getTeam(teamId) ?? undefined);
  }

  editTeamName(teamId: number) {
    if (!this.mainLocalPlayer) return;
    if (this.editingTeamId !== null)
      this.updateTeamName();
    if (this.mainLocalPlayer.state !== PlayerState.Ready && this.runHandler?.run?.timer.runState === RunState.Waiting)
      this.editingTeamId = teamId;
  }
  updateTeamName() {
    if (this.editingTeamId === null || !this.mainLocalPlayer) return;

    let team = this.runHandler.run?.getTeam(this.editingTeamId);
    if (!team) return;

    if (!team.name.replace(/\s/g, ''))
      team.name = "Team " + (team.id + 1);

    this.runHandler.sendEvent(EventType.ChangeTeamName, this.mainLocalPlayer.user.id, team);
    this.editingTeamId = null;
  }

  kickPlayer(user: UserBase) {
    if (this.runHandler.run?.timer.runIsOngoing()) {
      const dialogRef = this.dialog.open(ConfirmComponent, { data: "Are you sure you want to kick " + user.name + "?" });
      const dialogSubscription = dialogRef.afterClosed().subscribe(confirmed => {
        dialogSubscription.unsubscribe();
        if (confirmed)
          this.runHandler.sendEventAsMain(EventType.Kick, user);
      });
    }
    else
      this.runHandler.sendEventAsMain(EventType.Kick, user);
  }


  destory() {
    if (this.runSetupSubscription) this.runSetupSubscription.unsubscribe();
    this.runHandler.destroy();
  }

  ngOnDestroy() {
    this.destory();
  }
  
  @HostListener('window:unload', [ '$event' ])
  unloadHandler(event: any) {
    //event.returnValue = false; !TODO: Add once custom close button is added!
    this.destory();
  }

  @HostListener('window:beforeunload', [ '$event' ])
  beforeUnloadHandler(event: any) {
    //event.returnValue = false; !TODO: Add once custom close button is added!
    this.destory();
  }

}
