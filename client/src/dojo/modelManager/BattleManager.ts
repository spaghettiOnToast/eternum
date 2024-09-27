import { DojoResult } from "@/hooks/context/DojoContext";
import { ArmyInfo } from "@/hooks/helpers/useArmies";
import { Structure } from "@/hooks/helpers/useStructures";
import { Health } from "@/types";
import { BattleSide, EternumGlobalConfig, ID } from "@bibliothecadao/eternum";
import {
  ComponentValue,
  Components,
  Has,
  HasValue,
  getComponentValue,
  removeComponent,
  runQuery,
} from "@dojoengine/recs";
import { getEntityIdFromKeys } from "@dojoengine/utils";
import { ClientComponents } from "../createClientComponents";
import { StaminaManager } from "./StaminaManager";

export enum BattleType {
  Hex,
  Structure,
}

export enum BattleStatus {
  BattleStart = "Start battle",
  BattleOngoing = "",
  UserWon = "Victory",
  UserLost = "Defeat",
  BattleEnded = "Battle has ended",
}

export enum RaidStatus {
  isRaidable = "Raid!",
  NoStamina = "Not enough stamina",
  NoStructureToClaim = "No structure to raid",
  OwnStructure = "Can't raid your own structure",
  NoArmy = "No army selected",
  ArmyNotInBattle = "Selected army not in this battle",
}

export enum LeaveStatus {
  Leave = "Leave",
  NoBattleToLeave = "No battle to leave",
  DefenderCantLeaveOngoing = "A defender can't leave an ongoing battle",
  NoArmyInBattle = "Your armies aren't in this battle",
}

export enum BattleStartStatus {
  BattleStart = "Start battle",
  ForceStart = "Force start",
  NothingToAttack = "Nothing to attack",
  CantStart = "Can't start a battle now.",
}

export enum ClaimStatus {
  Claimable = "Claim",
  NoSelectedArmy = "No selected army",
  BattleOngoing = "Battle ongoing",
  NoStructureToClaim = "No structure to claim",
  StructureIsMine = "Can't claim your own structure",
  SelectedArmyIsDead = "Selected army is dead",
}

export class BattleManager {
  battleEntityId: ID;
  dojo: DojoResult;
  battleType: BattleType | undefined;
  private battleIsClaimable: ClaimStatus | undefined;

  constructor(battleEntityId: ID, dojo: DojoResult) {
    this.battleEntityId = battleEntityId;
    this.dojo = dojo;
  }

  public getUpdatedBattle(currentTimestamp: number) {
    const battle = this.getBattle();
    if (!battle) return;

    const battleClone = structuredClone(battle);

    if (this.isSiege(currentTimestamp)) {
      return battleClone;
    }

    this.updateHealth(battleClone, currentTimestamp);

    battleClone.defence_army.troops = this.getUpdatedTroops(
      battleClone.defence_army_health,
      battleClone.defence_army.troops,
    );
    battleClone.attack_army.troops = this.getUpdatedTroops(
      battleClone.attack_army_health,
      battleClone.attack_army.troops,
    );
    return battleClone;
  }

  public isBattle(): boolean {
    const battle = this.getBattle();
    return battle !== undefined;
  }

  public getElapsedTime(currentTimestamp: number): number {
    const battle = this.getBattle();

    if (!battle) return 0;

    const durationSinceLastUpdate = currentTimestamp - Number(battle.last_updated);
    if (Number(battle.duration_left) >= durationSinceLastUpdate) {
      return durationSinceLastUpdate;
    } else {
      return Number(battle.duration_left);
    }
  }

  public getTimeLeft(currentTimestamp: number): Date | undefined {
    const battle = this.getBattle();

    if (!battle) {
      return undefined;
    }

    const date = new Date(0);

    const durationSinceLastUpdate = currentTimestamp - Number(battle.last_updated);
    if (Number(battle.duration_left) > durationSinceLastUpdate) {
      date.setSeconds(Number(battle.duration_left) - durationSinceLastUpdate);
      return date;
    } else {
      return undefined;
    }
  }

  public isSiege(currentTimestamp: number): boolean {
    const battle = this.getBattle();
    if (!battle) {
      return false;
    }
    return battle?.duration_left !== 0n && battle?.start_at > currentTimestamp;
  }

  public getSiegeTimeLeft(currentTimestamp: number): Date {
    const battle = this.getBattle();

    const date = new Date(0);

    if (battle) {
      const secondsLeft = Math.max(Number(battle.start_at) - currentTimestamp, 0);
      date.setSeconds(secondsLeft);
    }
    return date;
  }

  public deleteBattle() {
    removeComponent(this.dojo.setup.components.Battle, getEntityIdFromKeys([BigInt(this.battleEntityId)]));
    this.dojo.network.world.deleteEntity(getEntityIdFromKeys([BigInt(this.battleEntityId)]));
    this.battleEntityId = 0;
  }

  public isBattleOngoing(currentTimestamp: number): boolean {
    const battle = this.getBattle();

    const timeSinceLastUpdate = this.getElapsedTime(currentTimestamp);

    return battle ? timeSinceLastUpdate < battle.duration_left : false;
  }

  public getBattle(): ComponentValue<ClientComponents["Battle"]["schema"]> | undefined {
    return getComponentValue(this.dojo.setup.components.Battle, getEntityIdFromKeys([BigInt(this.battleEntityId)]));
  }

  public getUpdatedArmy(
    army: ArmyInfo | undefined,
    updatedBattle: ComponentValue<ClientComponents["Battle"]["schema"]> | undefined,
  ) {
    if (!army) return;

    if (!updatedBattle) return army;

    const cloneArmy = structuredClone(army);

    let battle_army, battle_army_lifetime;
    if (army.battle_side === BattleSide[BattleSide.Defence]) {
      battle_army = updatedBattle.defence_army;
      battle_army_lifetime = updatedBattle.defence_army_lifetime;
    } else {
      battle_army = updatedBattle.attack_army;
      battle_army_lifetime = updatedBattle.attack_army_lifetime;
    }

    cloneArmy.troops.knight_count =
      cloneArmy.troops.knight_count === 0n
        ? 0n
        : BigInt(
            Math.floor(
              Number(cloneArmy.troops.knight_count) *
                this.getRemainingPercentageOfTroops(
                  battle_army.troops.knight_count,
                  battle_army_lifetime.troops.knight_count,
                ),
            ),
          );

    cloneArmy.troops.paladin_count =
      cloneArmy.troops.paladin_count === 0n
        ? 0n
        : BigInt(
            Math.floor(
              Number(cloneArmy.troops.paladin_count) *
                this.getRemainingPercentageOfTroops(
                  battle_army.troops.paladin_count,
                  battle_army_lifetime.troops.paladin_count,
                ),
            ),
          );

    cloneArmy.troops.crossbowman_count =
      cloneArmy.troops.crossbowman_count === 0n
        ? 0n
        : BigInt(
            Math.floor(
              Number(cloneArmy.troops.crossbowman_count) *
                this.getRemainingPercentageOfTroops(
                  battle_army.troops.crossbowman_count,
                  battle_army_lifetime.troops.crossbowman_count,
                ),
            ),
          );

    cloneArmy.health.current = this.getTroopFullHealth(cloneArmy.troops);

    return cloneArmy;
  }

  public isClaimable(
    currentTimestamp: number,
    selectedArmy: ArmyInfo | undefined,
    structure: Structure | undefined,
    defender: ArmyInfo | undefined,
  ): ClaimStatus {
    if (!selectedArmy) return ClaimStatus.NoSelectedArmy;
    if (this.battleIsClaimable) return this.battleIsClaimable;

    if (this.isBattleOngoing(currentTimestamp)) {
      return ClaimStatus.BattleOngoing;
    }

    if (!structure) {
      this.battleIsClaimable = ClaimStatus.NoStructureToClaim;
      return ClaimStatus.NoStructureToClaim;
    }

    if (this.getBattleType(structure) !== BattleType.Structure) {
      this.battleIsClaimable = ClaimStatus.NoStructureToClaim;
      return ClaimStatus.NoStructureToClaim;
    }

    if (defender === undefined) {
      this.battleIsClaimable = ClaimStatus.Claimable;
      return ClaimStatus.Claimable;
    }

    const updatedBattle = this.getUpdatedBattle(currentTimestamp);
    if (updatedBattle && updatedBattle.defence_army_health.current > 0n) {
      this.battleIsClaimable = ClaimStatus.BattleOngoing;
      return ClaimStatus.BattleOngoing;
    }

    if (defender.health.current > 0n) {
      this.battleIsClaimable = ClaimStatus.BattleOngoing;
      return ClaimStatus.BattleOngoing;
    }

    if (structure.isMine) {
      return ClaimStatus.StructureIsMine;
    }

    if (selectedArmy.health.current <= 0n) {
      return ClaimStatus.SelectedArmyIsDead;
    }

    this.battleIsClaimable = ClaimStatus.Claimable;
    return ClaimStatus.Claimable;
  }

  public isRaidable(
    currentTimestamp: number,
    currentArmiesTick: number,
    selectedArmy: ArmyInfo | undefined,
    structure: Structure | undefined,
  ): RaidStatus {
    if (!selectedArmy) return RaidStatus.NoArmy;

    if (!structure) return RaidStatus.NoStructureToClaim;

    if (this.isBattleOngoing(currentTimestamp) && selectedArmy.battle_id !== this.battleEntityId) {
      return RaidStatus.ArmyNotInBattle;
    }

    if (this.getBattleType(structure) === BattleType.Hex) {
      return RaidStatus.NoStructureToClaim;
    }

    if (structure.isMine) return RaidStatus.OwnStructure;

    const staminaManager = new StaminaManager(this.dojo.setup, selectedArmy.entity_id);
    if (staminaManager.getStamina(currentArmiesTick).amount === 0) return RaidStatus.NoStamina;

    return RaidStatus.isRaidable;
  }

  public isAttackable(
    selectedArmy: ArmyInfo | undefined,
    defender: ArmyInfo | undefined,
    currentTimestamp: number,
  ): BattleStartStatus {
    if (!defender) return BattleStartStatus.NothingToAttack;

    if (!this.isBattle() && defender.health.current > 0n) return BattleStartStatus.BattleStart;

    if (
      this.isSiege(currentTimestamp) &&
      selectedArmy?.isMine &&
      selectedArmy?.battle_side === BattleSide[BattleSide.Defence] &&
      selectedArmy?.protectee
    ) {
      return BattleStartStatus.ForceStart;
    }

    return BattleStartStatus.CantStart;
  }

  public isLeavable(currentTimestamp: number, selectedArmy: ArmyInfo | undefined): LeaveStatus {
    if (!this.isBattle()) return LeaveStatus.NoBattleToLeave;

    if (!selectedArmy) return LeaveStatus.NoArmyInBattle;

    if (selectedArmy.protectee && this.isBattleOngoing(currentTimestamp)) return LeaveStatus.DefenderCantLeaveOngoing;

    return LeaveStatus.Leave;
  }

  public isEmpty(): boolean {
    return (
      runQuery([
        Has(this.dojo.setup.components.Army),
        HasValue(this.dojo.setup.components.Army, { battle_id: this.battleEntityId }),
      ]).size === 0
    );
  }

  public async pillageStructure(raider: ArmyInfo, structureEntityId: ID) {
    if (this.battleEntityId !== 0 && this.battleEntityId === raider.battle_id) {
      await this.dojo.setup.systemCalls.battle_leave_and_pillage({
        signer: this.dojo.account.account,
        army_id: raider.entity_id,
        battle_id: this.battleEntityId,
        structure_id: structureEntityId,
      });
    } else {
      await this.dojo.setup.systemCalls.battle_pillage({
        signer: this.dojo.account.account,
        army_id: raider.entity_id,
        structure_id: structureEntityId,
      });
    }
  }

  public getBattleType(structure: Structure | undefined): BattleType {
    if (this.battleType) return this.battleType;

    if (!structure) {
      this.battleType = BattleType.Hex;
      return this.battleType;
    }

    this.battleType = BattleType.Structure;
    return this.battleType;
  }

  public getWinner(currentTimestamp: number, ownArmySide: string): BattleStatus {
    const battle = this.getUpdatedBattle(currentTimestamp);
    if (!battle) return BattleStatus.BattleStart;

    if (battle.attack_army_health.current > 0 && battle.defence_army_health.current > 0)
      return BattleStatus.BattleOngoing;

    if (ownArmySide === BattleSide[BattleSide.None]) {
      return BattleStatus.BattleEnded;
    }

    const { ownArmyHealth, opponentArmyHealth } =
      ownArmySide === BattleSide[BattleSide.Attack]
        ? { ownArmyHealth: battle.attack_army_health.current, opponentArmyHealth: battle.defence_army_health.current }
        : { ownArmyHealth: battle.defence_army_health.current, opponentArmyHealth: battle.attack_army_health.current };

    return ownArmyHealth > opponentArmyHealth ? BattleStatus.UserWon : BattleStatus.UserLost;
  }

  private getTroopFullHealth(troops: ComponentValue<ClientComponents["Army"]["schema"]["troops"]>): bigint {
    const health = EternumGlobalConfig.troop.health;

    let total_knight_health = health * Number(troops.knight_count);
    let total_paladin_health = health * Number(troops.paladin_count);
    let total_crossbowman_health = health * Number(troops.crossbowman_count);

    return BigInt(
      Math.floor(
        (total_knight_health + total_paladin_health + total_crossbowman_health) /
          (EternumGlobalConfig.resources.resourceMultiplier * Number(EternumGlobalConfig.troop.healthPrecision)),
      ),
    );
  }

  private getUpdatedTroops = (
    health: Health,
    currentTroops: ComponentValue<ClientComponents["Army"]["schema"]["troops"]>,
  ): ComponentValue<ClientComponents["Army"]["schema"]["troops"]> => {
    if (health.current > health.lifetime) {
      throw new Error("Current health shouldn't be bigger than lifetime");
    }

    if (health.lifetime === 0n) {
      return {
        knight_count: 0n,
        paladin_count: 0n,
        crossbowman_count: 0n,
      };
    }

    let knight_count = (health.current * currentTroops.knight_count) / health.lifetime;
    let paladin_count = (health.current * currentTroops.paladin_count) / health.lifetime;
    let crossbowman_count = (health.current * currentTroops.crossbowman_count) / health.lifetime;

    if (knight_count < EternumGlobalConfig.resources.resourcePrecision) {
      knight_count = 0n;
    }
    if (paladin_count < EternumGlobalConfig.resources.resourcePrecision) {
      paladin_count = 0n;
    }
    if (crossbowman_count < EternumGlobalConfig.resources.resourcePrecision) {
      crossbowman_count = 0n;
    }

    return {
      knight_count,
      paladin_count,
      crossbowman_count,
    };
  };

  private updateHealth(battle: ComponentValue<ClientComponents["Battle"]["schema"]>, currentTimestamp: number) {
    const durationPassed: number = this.getElapsedTime(currentTimestamp);

    const attackDelta = this.attackingDelta(battle);
    const defenceDelta = this.defendingDelta(battle);

    battle.attack_army_health.current = this.getUdpdatedHealth(defenceDelta, battle.attack_army_health, durationPassed);
    if (
      battle.attack_army_health.current <
      EternumGlobalConfig.troop.health * EternumGlobalConfig.resources.resourcePrecision
    ) {
      battle.attack_army_health.current = 0n;
    }

    battle.defence_army_health.current = this.getUdpdatedHealth(
      attackDelta,
      battle.defence_army_health,
      durationPassed,
    );
    if (
      battle.defence_army_health.current <
      EternumGlobalConfig.troop.health * EternumGlobalConfig.resources.resourcePrecision
    ) {
      battle.defence_army_health.current = 0n;
    }
  }

  private getUdpdatedHealth(
    delta: bigint,
    health: ComponentValue<ClientComponents["Battle"]["schema"]["defence_army_health"]>,
    durationPassed: number,
  ) {
    const damagesDone = this.damagesDone(delta, durationPassed);
    return this.getCurrentHealthAfterDamage(health, damagesDone);
  }

  private attackingDelta(battle: ComponentValue<Components["Battle"]["schema"]>) {
    return battle.attack_delta;
  }

  private defendingDelta(battle: ComponentValue<Components["Battle"]["schema"]>) {
    return battle.defence_delta;
  }

  private damagesDone(delta: bigint, durationPassed: number): bigint {
    return delta * BigInt(durationPassed);
  }

  private getCurrentHealthAfterDamage(health: ComponentValue<Components["Health"]["schema"]>, damages: bigint) {
    return damages > health.current ? 0n : health.current - damages;
  }

  private getRemainingPercentageOfTroops(current_troops: bigint, lifetime_troops: bigint) {
    if (lifetime_troops === 0n) return 0;
    return Number(current_troops) / Number(lifetime_troops);
  }
}
