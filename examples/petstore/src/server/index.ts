import { createExpress } from "@typespec-ts/adapter-express";

import type { $paths, Pet } from "../../tsp-output/@typespec-ts/emitter/output.js";

const pets: Record<string, Pet> = {};

const app = createExpress<$paths>();

app.get("/pets", (req, res) => {
  res.json(Object.values(pets).slice(0, req.query.limit));
});

app.post("/pets", (req, res) => {
  pets[req.body.id] = req.body;
  res.sendStatus(201);
});

app.get("/pets/{petId}", (req, res) => {
  const pet = pets[req.params.petId];
  if (!pet) {
    return res.status(404).send({
      code: 404,
      message: "The specified pet could not be found.",
    });
  }

  res.send(pet);
});

app.express.listen(8080, () => console.log("ready"));
