import { ResourceMiningTypes } from "@/types";
import { BuildingType, RealmLevelNames, RealmLevels, ResourcesIds, StructureType } from "@bibliothecadao/eternum";
import * as THREE from "three";
import { BiomeType } from "../components/Biome";

export const HEX_SIZE = 1;
export const BUILDINGS_CENTER = [10, 10];

export const PREVIEW_BUILD_COLOR_VALID = 0x00a300;
export const PREVIEW_BUILD_COLOR_INVALID = 0xff0000;

export const structureTypeToBuildingType: Record<StructureType, BuildingType> = {
  [StructureType.Bank]: BuildingType.Bank,
  [StructureType.Realm]: BuildingType.Castle,
  [StructureType.FragmentMine]: BuildingType.FragmentMine,
  [StructureType.Settlement]: BuildingType.Castle,
  [StructureType.Hyperstructure]: BuildingType.Castle,
};

export const castleLevelToRealmCastle: Record<RealmLevels, RealmLevelNames> = {
  [RealmLevels.Settlement]: RealmLevelNames.Settlement,
  [RealmLevels.City]: RealmLevelNames.City,
  [RealmLevels.Kingdom]: RealmLevelNames.Kingdom,
  [RealmLevels.Empire]: RealmLevelNames.Empire,
};

export const buildingModelPaths: Record<BuildingType | ResourceMiningTypes | RealmLevelNames, string> = {
  // placeholder for now
  [BuildingType.None]: "/models/buildings/farm.glb",
  [BuildingType.Bank]: "/models/buildings/market.glb",
  [BuildingType.ArcheryRange]: "/models/buildings/archer_range.glb",
  [BuildingType.Barracks]: "/models/buildings/barracks.glb",
  [BuildingType.Castle]: "/models/buildings/castle1.glb",
  [BuildingType.Farm]: "/models/buildings/farm.glb",
  [BuildingType.FishingVillage]: "/models/buildings/fishery.glb",
  [BuildingType.FragmentMine]: "/models/buildings/mine.glb",
  [BuildingType.Market]: "/models/buildings/market.glb",
  [BuildingType.Resource]: "/models/buildings/mine.glb",
  [BuildingType.Stable]: "/models/buildings/stable.glb",
  [BuildingType.Storehouse]: "/models/buildings/storehouse.glb",
  [BuildingType.TradingPost]: "/models/buildings/market.glb",
  [BuildingType.Walls]: "/models/buildings/market.glb",
  [BuildingType.WatchTower]: "/models/buildings/market.glb",
  [BuildingType.WorkersHut]: "/models/buildings/workers_hut.glb",
  [ResourceMiningTypes.Forge]: "/models/buildings/forge.glb",
  [ResourceMiningTypes.Mine]: "/models/buildings/mine_2.glb",
  [ResourceMiningTypes.LumberMill]: "/models/buildings/lumber_mill.glb",
  [ResourceMiningTypes.Dragonhide]: "/models/buildings/dragonhide.glb",
  [RealmLevelNames.Settlement]: "/models/buildings/castle0.glb",
  [RealmLevelNames.City]: "/models/buildings/castle1.glb",
  [RealmLevelNames.Kingdom]: "/models/buildings/castle2.glb",
  [RealmLevelNames.Empire]: "/models/buildings/castle3.glb",
};

const BASE_PATH = "/models/biomes/";
export const biomeModelPaths: Record<BiomeType | "Outline", string> = {
  DeepOcean: BASE_PATH + "ocean.glb",
  Ocean: BASE_PATH + "deepocean.glb",
  Beach: BASE_PATH + "beach.glb",
  Scorched: BASE_PATH + "scorched.glb",
  Bare: BASE_PATH + "bare.glb",
  Tundra: BASE_PATH + "tundra.glb",
  Snow: BASE_PATH + "snow.glb",
  TemperateDesert: BASE_PATH + "temperateDesert.glb",
  Shrubland: BASE_PATH + "shrubland.glb",
  Taiga: BASE_PATH + "taiga.glb",
  Grassland: BASE_PATH + "grassland.glb",
  TemperateDeciduousForest: BASE_PATH + "deciduousforest.glb",
  TemperateRainForest: BASE_PATH + "temperateRainforest.glb",
  SubtropicalDesert: BASE_PATH + "temperateDesert.glb",
  TropicalSeasonalForest: BASE_PATH + "tropicalSeasonalForest.glb",
  TropicalRainForest: BASE_PATH + "tropicalrainforest.glb",
  Outline: BASE_PATH + "outline.glb",
};

export const PROGRESS_HALF_THRESHOLD = 0.5;
export const PROGRESS_FINAL_THRESHOLD = 1;

export enum StructureProgress {
  STAGE_1 = 0,
  STAGE_2 = 1,
  STAGE_3 = 2,
}

export const StructureModelPaths: Record<StructureType, string[]> = {
  [StructureType.Realm]: ["models/buildings/castle2.glb"],
  // Order follows StructureProgress
  [StructureType.Hyperstructure]: [
    "models/buildings/hyperstructure_init.glb",
    "models/buildings/hyperstructure_half.glb",
    "models/buildings/hyperstructureAnimated.glb",
  ],
  [StructureType.Bank]: ["/models/buildings/market.glb"],
  [StructureType.FragmentMine]: ["models/buildings/mine.glb"],
  // placeholder for now
  [StructureType.Settlement]: ["models/buildings/mine.glb"],
};

export const StructureLabelPaths: Record<StructureType, string> = {
  [StructureType.Realm]: "textures/realm_label.png",
  [StructureType.Hyperstructure]: "textures/hyper_label.png",
  [StructureType.FragmentMine]: "textures/fragment_mine_label.png",
  // placeholder for now
  [StructureType.Bank]: "",
  // placeholder for now
  [StructureType.Settlement]: "textures/fragment_mine_label.png",
};

export const MinesMaterialsParams: Record<
  number,
  { color: THREE.Color; emissive: THREE.Color; emissiveIntensity: number }
> = {
  [ResourcesIds.Diamonds]: {
    color: new THREE.Color(1.6, 1.47, 1.96),
    emissive: new THREE.Color(0.8, 0.73, 5.93),
    emissiveIntensity: 0.2,
  },
  [ResourcesIds.Sapphire]: {
    color: new THREE.Color(0.23, 0.5, 0.96),
    emissive: new THREE.Color(0, 0, 5.01),
    emissiveIntensity: 2.5,
  },
  [ResourcesIds.Ruby]: {
    color: new THREE.Color(0.86, 0.15, 0.15),
    emissive: new THREE.Color(2.59, 0.0, 0.0),
    emissiveIntensity: 4,
  },
  [ResourcesIds.DeepCrystal]: {
    color: new THREE.Color(1.21, 2.7, 3.27),
    emissive: new THREE.Color(0.58, 0.77, 3),
    emissiveIntensity: 5,
  },
  [ResourcesIds.TwilightQuartz]: {
    color: new THREE.Color(0.43, 0.16, 0.85),
    emissive: new THREE.Color(0.0, 0.03, 4.25),
    emissiveIntensity: 5.7,
  },
  [ResourcesIds.EtherealSilica]: {
    color: new THREE.Color(0.06, 0.73, 0.51),
    emissive: new THREE.Color(0.0, 0.12, 0.0),
    emissiveIntensity: 2,
  },
  [ResourcesIds.Stone]: {
    color: new THREE.Color(0.38, 0.38, 0.38),
    emissive: new THREE.Color(0, 0, 0),
    emissiveIntensity: 0,
  },
  [ResourcesIds.Coal]: {
    color: new THREE.Color(0.18, 0.18, 0.18),
    emissive: new THREE.Color(0, 0, 0),
    emissiveIntensity: 0,
  },
  [ResourcesIds.Obsidian]: {
    color: new THREE.Color(0.06, 0.06, 0.06),
    emissive: new THREE.Color(0, 0, 0),
    emissiveIntensity: 1,
  },
  [ResourcesIds.TrueIce]: {
    color: new THREE.Color(3.0, 3.0, 3.8),
    emissive: new THREE.Color(1.0, 1.0, 1),
    emissiveIntensity: 4,
  },
};
