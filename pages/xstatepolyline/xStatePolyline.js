import Konva from "konva";
import { createMachine, interpret } from "xstate";


const stage = new Konva.Stage({
    container: "container",
    width: 400,
    height: 400,
});

const layer = new Konva.Layer();
stage.add(layer);

const MAX_POINTS = 10;
let polyline // La polyline en cours de construction;

const polylineMachine = createMachine(
    {
        /** @xstate-layout N4IgpgJg5mDOIC5QAcD2AbAngGQJYDswA6XCdMAYgFkB5AVQGUBRAYWwEkWBpAbQAYAuohSpYuAC65U+YSAAeiAMwA2IgBY+mgIx8NATgCsBvWuUAaEJkQBaAExqifAOx8AHFpcHbfRX2V+AXwCLNCw8QiIAETgxfC00AnEKJlgAYwBDZDB+ISQQNDFJaVkFBANXIldbDwNTZScDFS01CysELVsK6oMnPWVFA2VlPTdbIJCMHAJiaNhY+NRE6npmWgA1JhzZAokpGTzStSOiRQGtZqMPD2UDVptmh2VbJ6etVxU+vXH8yfCZmIICyWtEYrA43C2eR2RX2oFKZyIelcalsl1crgMfA6TjuCGUFS0vlcej0ThUtjJ+O+oSmEVmsVsEDACXw4lgy1B602gm2ol2xQOiFcTicRCMahUgw8JL0Wlxvj4lWuVQMWmGR2R1N+0yiAPwjOZi1Z7IAQulUgBrWDIc3ZHlQvkwkqIHS9E4DPpqRr9FG4nSK94dXw6Qn1WyKLVhHX0ggGlls5KssAAJ0hIkKe2dCG8WhOfFJ4f6TjUVXRuLsp0RmPVzWUavsY2CPyjdL1caNCZBzDYnF49vT-Nh8hdugcTnDXtqPWe5XLoaIIpLIecPQ8akjtP+c1jTPj7JSGSyaZ+GYFcKUXqIyhR+Il4be50UuM6igXI1lfFs1TeAyCTfwqBMvADotmAvKnkOpTWA86iaJowzEl6thIuWijVEQqJ+MSJiKH0ThaBufwkGQYEOhBWbWH0sFwQhJheChlj3FeXruNW7jDB0biEdGepAqy4GDlmFIVMYMp6IoHSca4c7MeUapqLKnQin0jYTKBurbvqu4dsBA5OoKCBVA4WJ8MYVRIhJuEydecnXopwq9KSf4BEAA */
        id: "polyLine",

        initial: "idle",

        states : {
            idle: {
                on: {
                    MOUSECLICK: {
                        target: "Dessin1point",
                        actions: "createLine"
                    }
                }
            },

            Dessin1point: {
                on: {
                    Escape: {
                        target: "idle",
                        actions: "abandon"
                    },

                    MOUSEMOVE: {
                        target: "Dessin1point",
                        actions: "setLastPoint",
                        internal: true
                    },

                    MOUSECLICK: {
                        target: "Dessin2depoints",
                        actions: "addPoint"
                    }
                }
            },

            Dessin2depoints: {
                on: {
                    MOUSEMOVE: {
                        target: "Dessin2depoints",
                        actions: "setLastPoint",
                        internal: true
                    },

                    Backspace: {
                        target: "Dessin2depoints",
                        actions: "removeLastPoint",
                        internal: true
                    },

                    Enter: {
                        target: "idle",
                        actions: "saveLine"
                    },

                    MOUSECLICK: {
                        target: "Dessin2depoints",
                        actions: "addPoint",
                        internal: true,
                        cond: "pasPlein"
                    },

                    Escape: {
                        target: "idle",
                        actions: "abandon"
                    },
                }
            }
        }
    },
    // Quelques actions et guardes que vous pouvez utiliser dans votre machine
    {
        actions: {
            // Créer une nouvelle polyline
            createLine: (context, event) => {
                const pos = stage.getPointerPosition();
                polyline = new Konva.Line({
                    points: [pos.x, pos.y, pos.x, pos.y],
                    stroke: "red",
                    strokeWidth: 2,
                });
                layer.add(polyline);
            },
            // Mettre à jour le dernier point (provisoire) de la polyline
            setLastPoint: (context, event) => {
                const pos = stage.getPointerPosition();
                const currentPoints = polyline.points(); // Get the current points of the line
                const size = currentPoints.length;

                const newPoints = currentPoints.slice(0, size - 2); // Remove the last point
                polyline.points(newPoints.concat([pos.x, pos.y]));
                layer.batchDraw();
            },
            // Enregistrer la polyline
            saveLine: (context, event) => {
                const currentPoints = polyline.points(); // Get the current points of the line
                const size = currentPoints.length;
                // Le dernier point(provisoire) ne fait pas partie de la polyline
                const newPoints = currentPoints.slice(0, size - 2);
                polyline.points(newPoints);
                layer.batchDraw();
            },
            // Ajouter un point à la polyline
            addPoint: (context, event) => {
                const pos = stage.getPointerPosition();
                const currentPoints = polyline.points(); // Get the current points of the line
                const newPoints = [...currentPoints, pos.x, pos.y]; // Add the new point to the array
                polyline.points(newPoints); // Set the updated points to the line
                layer.batchDraw(); // Redraw the layer to reflect the changes
            },
            // Abandonner le tracé de la polyline
            abandon: (context, event) => {
                polyline.remove();
            },
            // Supprimer le dernier point de la polyline
            removeLastPoint: (context, event) => {
                const currentPoints = polyline.points(); // Get the current points of the line
                const size = currentPoints.length;
                const provisoire = currentPoints.slice(size - 2, size); // Le point provisoire
                const oldPoints = currentPoints.slice(0, size - 4); // On enlève le dernier point enregistré
                polyline.points(oldPoints.concat(provisoire)); // Set the updated points to the line
                layer.batchDraw(); // Redraw the layer to reflect the changes
            },
        },
        guards: {
            // On peut encore ajouter un point
            pasPlein: (context, event) => {
                return polyline.points().length < MAX_POINTS * 2;
            },
            // On peut enlever un point
            plusDeDeuxPoints: (context, event) => {
                // Deux coordonnées pour chaque point, plus le point provisoire
                return polyline.points().length > 6;
            },
        },
    }
);

// On démarre la machine
const polylineService = interpret(polylineMachine)
    .onTransition((state) => {
        console.log("Current state:", state.value);
    })
    .start();
// On envoie les événements à la machine
stage.on("click", () => {
    polylineService.send("MOUSECLICK");
});

stage.on("mousemove", () => {
    polylineService.send("MOUSEMOVE");
});

// Envoi des touches clavier à la machine
window.addEventListener("keydown", (event) => {
    console.log("Key pressed:", event.key);
    // Enverra "a", "b", "c", "Escape", "Backspace", "Enter"... à la machine
    polylineService.send(event.key);
});
