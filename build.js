import { TextLineStream } from "jsr:@std/streams/text-line-stream";

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
  const file = await Deno.open("mGSL/dist/mGSL.lst");
  const lineStream = file.readable
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new TextLineStream());
  for await (const line of lineStream) {
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
