const includeRandom = (): string => /* wgsl */ `

[[block]] struct Random {
  seeds: array<u32>;
};

[[group(0), binding(1)]] var<storage, write> random: Random;

fn rnd(index: u32) -> u32 {
  random.seeds[index] = (random.seeds[index] * 268435399u + 11u) & ((1u << 24u) - 1u);
  return (random.seeds[index] >> 16u) | (random.seeds[index] << 16u);
}

`;

export default includeRandom;
