import { type HexPosition } from "@/types";
import { FELT_CENTER } from "@/ui/config";
import { getEntityIdFromKeys } from "@/ui/utils/utils";
import {
  CapacityConfigCategory,
  ContractAddress,
  EternumGlobalConfig,
  ID,
  ResourcesIds,
  TravelTypes,
  WORLD_CONFIG_ID,
  getDirectionBetweenAdjacentHexes,
  getNeighborHexes,
} from "@bibliothecadao/eternum";
import { getComponentValue, type ComponentValue, type Entity } from "@dojoengine/recs";
import { uuid } from "@latticexyz/utils";
import { type ClientComponents } from "../createClientComponents";
import { type SetupResult } from "../setup";
import { ProductionManager } from "./ProductionManager";
import { StaminaManager } from "./StaminaManager";
import { getRemainingCapacity } from "./utils/ArmyMovementUtils";

export class TravelPaths {
  private readonly paths: Map<string, { path: HexPosition[]; isExplored: boolean }>;

  constructor() {
    this.paths = new Map();
  }

  set(key: string, value: { path: HexPosition[]; isExplored: boolean }): void {
    this.paths.set(key, value);
  }

  deleteAll(): void {
    this.paths.clear();
  }

  get(key: string): { path: HexPosition[]; isExplored: boolean } | undefined {
    return this.paths.get(key);
  }

  has(key: string): boolean {
    return this.paths.has(key);
  }

  values(): IterableIterator<{ path: HexPosition[]; isExplored: boolean }> {
    return this.paths.values();
  }

  getHighlightedHexes(): Array<{ col: number; row: number }> {
    return Array.from(this.paths.values()).map(({ path }) => ({
      col: path[path.length - 1].col - FELT_CENTER,
      row: path[path.length - 1].row - FELT_CENTER,
    }));
  }

  isHighlighted(row: number, col: number): boolean {
    return this.paths.has(TravelPaths.posKey({ col: col + FELT_CENTER, row: row + FELT_CENTER }));
  }

  getPaths(): Map<string, { path: HexPosition[]; isExplored: boolean }> {
    return this.paths;
  }

  static posKey(pos: HexPosition, normalized = false): string {
    const col = normalized ? pos.col + FELT_CENTER : pos.col;
    const row = normalized ? pos.row + FELT_CENTER : pos.row;
    return `${col},${row}`;
  }
}

export class ArmyMovementManager {
  private readonly entity: Entity;
  private readonly entityId: ID;
  private readonly address: ContractAddress;
  private readonly fishManager: ProductionManager;
  private readonly wheatManager: ProductionManager;
  private readonly staminaManager: StaminaManager;
  private readonly entityQuantity: ComponentValue<ClientComponents["Quantity"]["schema"]>;

  constructor(private readonly setup: SetupResult, entityId: ID) {
    this.entity = getEntityIdFromKeys([BigInt(entityId)]);
    this.entityId = entityId;
    this.address = ContractAddress(this.setup.network.burnerManager.account?.address || 0n);
    const entityOwnerId = getComponentValue(this.setup.components.EntityOwner, this.entity);
    this.entityQuantity = getComponentValue(this.setup.components.Quantity, this.entity) ?? { entity_id: 0, value: 0n };
    this.wheatManager = new ProductionManager(this.setup, entityOwnerId!.entity_owner_id, ResourcesIds.Wheat);
    this.fishManager = new ProductionManager(this.setup, entityOwnerId!.entity_owner_id, ResourcesIds.Fish);
    this.staminaManager = new StaminaManager(this.setup, entityId);
  }

  private _canExplore(currentDefaultTick: number, currentArmiesTick: number): boolean {
    const stamina = this.staminaManager.getStamina(currentArmiesTick);

    // TODO: move to a global Class which is initalised only once on load
    const staminaConfig = getComponentValue(
      this.setup.components.TravelStaminaCostConfig,
      getEntityIdFromKeys([WORLD_CONFIG_ID, BigInt(TravelTypes.Explore)]),
    );

    if (stamina.amount < this.setup.configManager.getStaminaExploreConfig()) {
      return false;
    }
    const { wheat, fish } = this.getFood(currentDefaultTick);

    const wheatPayAmount =
      EternumGlobalConfig.exploration.exploreWheatBurn *
      EternumGlobalConfig.resources.resourcePrecision *
      Number(this.entityQuantity.value);
    const fishPayAmount =
      EternumGlobalConfig.exploration.exploreFishBurn *
      EternumGlobalConfig.resources.resourcePrecision *
      Number(this.entityQuantity.value);

    if (fish < fishPayAmount) {
      return false;
    }
    if (wheat < wheatPayAmount) {
      return false;
    }

    if (this._getArmyRemainingCapacity() < EternumGlobalConfig.exploration.reward) {
      return false;
    }

    return true;
  }

  private readonly _calculateMaxTravelPossible = (currentDefaultTick: number, currentArmiesTick: number) => {
    const stamina = this.staminaManager.getStamina(currentArmiesTick);
    const maxStaminaSteps = Math.floor((stamina.amount || 0) / this.setup.configManager.getStaminaTravelConfig());

    const travelWheatPayAmountPerStep =
      EternumGlobalConfig.exploration.travelWheatBurn *
      EternumGlobalConfig.resources.resourcePrecision *
      Number(this.entityQuantity.value);
    const travelFishPayAmountPerStep =
      EternumGlobalConfig.exploration.travelFishBurn *
      EternumGlobalConfig.resources.resourcePrecision *
      Number(this.entityQuantity.value);
    const { wheat, fish } = this.getFood(currentDefaultTick);
    const maxTravelWheatSteps = Math.floor(wheat / travelWheatPayAmountPerStep);
    const maxTravelFishSteps = Math.floor(fish / travelFishPayAmountPerStep);
    const maxTravelSteps = Math.min(maxTravelWheatSteps, maxTravelFishSteps);
    return Math.min(maxStaminaSteps, maxTravelSteps);
  };

  private readonly _getCurrentPosition = () => {
    const position = getComponentValue(this.setup.components.Position, this.entity);
    return { col: position!.x, row: position!.y };
  };

  public getFood(currentDefaultTick: number) {
    const wheatBalance = this.wheatManager.balance(currentDefaultTick);
    const fishBalance = this.fishManager.balance(currentDefaultTick);

    return {
      wheat: wheatBalance,
      fish: fishBalance,
    };
  }

  public findPaths(
    exploredHexes: Map<number, Set<number>>,
    currentDefaultTick: number,
    currentArmiesTick: number,
  ): TravelPaths {
    const startPos = this._getCurrentPosition();
    const maxHex = this._calculateMaxTravelPossible(currentDefaultTick, currentArmiesTick);
    const canExplore = this._canExplore(currentDefaultTick, currentArmiesTick);

    const priorityQueue: Array<{ position: HexPosition; distance: number; path: HexPosition[] }> = [
      { position: startPos, distance: 0, path: [startPos] },
    ];
    const travelPaths = new TravelPaths();
    const shortestDistances = new Map<string, number>();

    while (priorityQueue.length > 0) {
      priorityQueue.sort((a, b) => a.distance - b.distance); // This makes the queue work as a priority queue
      const { position: current, distance, path } = priorityQueue.shift()!;
      const currentKey = TravelPaths.posKey(current);

      if (!shortestDistances.has(currentKey) || distance < shortestDistances.get(currentKey)!) {
        shortestDistances.set(currentKey, distance);
        const isExplored = exploredHexes.get(current.col - FELT_CENTER)?.has(current.row - FELT_CENTER) || false;
        if (path.length >= 2) {
          travelPaths.set(currentKey, { path, isExplored });
        }
        if (!isExplored) continue;

        const neighbors = getNeighborHexes(current.col, current.row); // This function needs to be defined
        for (const { col, row } of neighbors) {
          const neighborKey = TravelPaths.posKey({ col, row });
          const nextDistance = distance + 1;
          const nextPath = [...path, { col, row }];

          const isExplored = exploredHexes.get(col - FELT_CENTER)?.has(row - FELT_CENTER) || false;
          if ((isExplored && nextDistance <= maxHex) || (!isExplored && canExplore && nextDistance === 1)) {
            if (!shortestDistances.has(neighborKey) || nextDistance < shortestDistances.get(neighborKey)!) {
              priorityQueue.push({ position: { col, row }, distance: nextDistance, path: nextPath });
            }
          }
        }
      }
    }

    return travelPaths;
  }

  public isMine = () => {
    const entityOwner = getComponentValue(this.setup.components.EntityOwner, this.entity);
    let owner = getComponentValue(this.setup.components.Owner, this.entity);
    if (!owner && entityOwner?.entity_owner_id) {
      owner = getComponentValue(
        this.setup.components.Owner,
        getEntityIdFromKeys([BigInt(entityOwner.entity_owner_id)]),
      );
    }
    return owner?.address === this.address;
  };

  private readonly _optimisticStaminaUpdate = (overrideId: string, cost: number, currentArmiesTick: number) => {
    const stamina = this.staminaManager.getStamina(currentArmiesTick);

    // substract the costs
    this.setup.components.Stamina.addOverride(overrideId, {
      entity: this.entity,
      value: {
        entity_id: stamina.entity_id,
        last_refill_tick: stamina.last_refill_tick,
        amount: stamina.amount - cost,
      },
    });
  };

  private readonly _optimisticTileUpdate = (overrideId: string, col: number, row: number) => {
    const entity = getEntityIdFromKeys([BigInt(col), BigInt(row)]);

    this.setup.components.Tile.addOverride(overrideId, {
      entity,
      value: {
        col,
        row,
        explored_by_id: this.entityId,
        explored_at: BigInt(Math.floor(Date.now() / 1000)),
        biome: "None",
      },
    });
  };

  private readonly _optimisticPositionUpdate = (overrideId: string, col: number, row: number) => {
    this.setup.components.Position.addOverride(overrideId, {
      entity: this.entity,
      value: {
        entity_id: this.entityId,
        x: col,
        y: row,
      },
    });
  };

  private readonly _optimisticExplore = (col: number, row: number, currentArmiesTick: number) => {
    const overrideId = uuid();

    this._optimisticStaminaUpdate(overrideId, EternumGlobalConfig.stamina.exploreCost, currentArmiesTick);
    this._optimisticTileUpdate(overrideId, col, row);
    this._optimisticPositionUpdate(overrideId, col, row);

    return overrideId;
  };

  private readonly _findDirection = (path: HexPosition[]) => {
    if (path.length !== 2) return undefined;

    const startPos = { col: path[0].col, row: path[0].row };
    const endPos = { col: path[1].col, row: path[1].row };
    return getDirectionBetweenAdjacentHexes(startPos, endPos);
  };

  private readonly _exploreHex = async (path: HexPosition[], currentArmiesTick: number) => {
    const direction = this._findDirection(path);
    if (direction === undefined || direction === null) return;

    const overrideId = this._optimisticExplore(path[1].col, path[1].row, currentArmiesTick);

    this.setup.systemCalls
      .explore({
        unit_id: this.entityId,
        direction,
        signer: this.setup.network.burnerManager.account!,
      })
      .catch((e) => {
        this.setup.components.Position.removeOverride(overrideId);
        this.setup.components.Tile.removeOverride(overrideId);
      })
      .then(() => {
        this.setup.components.Stamina.removeOverride(overrideId);
      });
  };

  private readonly _optimisticTravelHex = (col: number, row: number, pathLength: number, currentArmiesTick: number) => {
    const overrideId = uuid();

    this._optimisticStaminaUpdate(overrideId, EternumGlobalConfig.stamina.travelCost * pathLength, currentArmiesTick);

    this.setup.components.Position.addOverride(overrideId, {
      entity: this.entity,
      value: {
        entity_id: this.entityId,
        x: col,
        y: row,
      },
    });
    return overrideId;
  };

  private readonly _travelToHex = async (path: HexPosition[], currentArmiesTick: number) => {
    const overrideId = this._optimisticTravelHex(
      path[path.length - 1].col,
      path[path.length - 1].row,
      path.length - 1,
      currentArmiesTick,
    );

    const directions = path
      .map((_, i) => {
        if (path[i + 1] === undefined) return undefined;
        return this._findDirection([
          { col: path[i].col, row: path[i].row },
          { col: path[i + 1].col, row: path[i + 1].row },
        ]);
      })
      .filter((d) => d !== undefined) as number[];

    this.setup.systemCalls
      .travel_hex({
        signer: this.setup.network.burnerManager.account!,
        travelling_entity_id: this.entityId,
        directions,
      })
      .catch(() => {
        this.setup.components.Position.removeOverride(overrideId);
      })
      .then(() => {
        this.setup.components.Stamina.removeOverride(overrideId);
      });
  };

  public moveArmy = (path: HexPosition[], isExplored: boolean, currentArmiesTick: number) => {
    if (!isExplored) {
      this._exploreHex(path, currentArmiesTick);
    } else {
      this._travelToHex(path, currentArmiesTick);
    }
  };

  private readonly _getArmyRemainingCapacity = () => {
    const armyCapacity = getComponentValue(
      this.setup.components.CapacityConfig,
      getEntityIdFromKeys([BigInt(CapacityConfigCategory.Army)]),
    );
    const armyWeight = getComponentValue(this.setup.components.Weight, this.entity);
    const armyEntity = getComponentValue(this.setup.components.Army, this.entity);

    if (!armyEntity || !armyCapacity) return 0n;

    return getRemainingCapacity(armyEntity, armyCapacity, armyWeight);
  };
}
