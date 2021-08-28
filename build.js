import { readLines } from "https://deno.land/std/io/mod.ts";

async function generateProblems() {
  const levelArray = [
    200,
    400,
    600,
    800,
    1000,
    1200,
    1400,
    1600,
    1800,
    2200,
    2600,
    3000,
  ];
  for (let i = 0; i < 37; i++) {
    levelArray.push(4000 + i * 1000);
  }
  let i = 0;
  let count = 0;
  let data = [];
  const fileReader = await Deno.open("mGSL/dist/mGSL.lst");
  for await (const line of readLines(fileReader)) {
    count += 1;
    data.push(line.split("\t", 2).join("\t"));
    if (levelArray[i] == count) {
      Deno.writeTextFile("src/data/" + levelArray[i] + ".tsv", data.join("\n"));
      i += 1;
      data = [];
    }
  }
}

await generateProblems();
