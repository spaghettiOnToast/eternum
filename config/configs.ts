import type { Config } from "@bibliothecadao/eternum";
import { EternumGlobalConfig } from "@bibliothecadao/eternum";

export const fastMode: Config = {
  ...EternumGlobalConfig,
  // increase the donkey speed
  speed: {
    ...EternumGlobalConfig.speed,
    donkey: 6,
  },
  // reduce the amount of time between armies ticks
  tick: {
    ...EternumGlobalConfig.tick,
    armiesTickIntervalInSeconds: 1800,
  },
  // increase the amount of points per cycle and on completion
  hyperstructures: {
    ...EternumGlobalConfig.hyperstructures,
    hyperstructurePointsPerCycle: 30,
    hyperstructurePointsOnCompletion: 1_000_000,
  },
  // reduce the amount of mercenaries
  mercenaries: {
    ...EternumGlobalConfig.mercenaries,
    knights_lower_bound: 1000,
    knights_upper_bound: 2000,
    paladins_lower_bound: 1000,
    paladins_upper_bound: 2000,
    crossbowmen_lower_bound: 1000,
    crossbowmen_upper_bound: 2000,
  },
};
