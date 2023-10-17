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
        /** @xstate-layout N4IgpgJg5mDOIC5QAcD2AbAngGQJYDswA6XCdMAYgFkB5AVQGUBRAYWwEkWBpAbQAYAuohSpYuAC65U+YSAAeiAMwA2IgBY+mgIx8NATgCsBvWuUAaEJkQBaAExqifAOx8AHFpcHbfRX2V+AXwCLNCw8QiIAETgxfAACAGoIMDi0AnFYanpmWgA1Jn4hJBA0MUlpWQUENRqiRUUDLS01Iw8PZQMLKwRrZodlWwGBrVcVPWU9IJCMHAJiaNhYuK00-HEsxlYObkLZUokpGWKqxXH1FxUJg1O9Vz5Oy0RXWyIJ5ScTAw7lCdtbKZKM3C8xiBESyVSqHSmQAQgBDADGAGtYMhEWBdsV9uUjqAqjoPnUGuMWipFGpbF1EDo+ERRlpbL4dFoVE5GQDQrMIgslkkUqsMhQmGswAAnTEiMqHSqIbxaOp8PRsslONTPVyuKk9RmKIiGPwmZrKLQDCkcoFzKKg+IrKFrIWwBFw5AYwR7UQHCrHRAGVx02weAymd7XY1qLUMv0BgwfZQNH56Nz-YKAsKWnlgvmQ6EOp0uiWAqVevHUr56ln+DyMxN6QxaxmqO4fDW2PTktXJ6Zp7nW8H8u2C2ibNicXhurEenEyhA6WrKlpBmODX1a3oqIhOVXuPgEmMeNTm7sgxaZiECzJDnI0fI8LRFSWe3HyJ5uOm+Ny+FxqJrhx4IRStnq9hkguSo+E4QQpvgqDJPAE5Hu6RZPlUvS1BomgGq4nytpqf7WAB8q2AYfiuE45J3Puh5csQpDkIhj7TtYZzoZoExYS0OGrvKygtO4xHKO4EwMm4VHAlaJ42gK9FTt6CC2E4frGLWtaKAywm4d0vSvLxJpqHokabuMnaptR4m8meA5wQ+MklggzwODu9y3DhqmnFx2m+rp+m2KRHxKpBARAA */
        id: "polyLine",

        initial: "idle",

        states : {
            idle: {
                on: {
                    MOUSECLICK: {
                        target: "Dessin 1point",
                        actions: "createLine"
                    }
                }
            },

            "Dessin 1point": {
                on: {
                    Escape: {
                        target: "idle",
                        actions: "abandon"
                    }
                }
            },

            "Dessin +de points": {
                on: {
                    MOUSEMOVE: [{
                        target: "Dessin 1point",
                        actions: "setLastPoint",
                        cond: "currentsPoints.length = 3"
                    }, {
                        target: "Dessin +de points",
                        internal: true
                    }],

                    Backspace: {
                        target: "Dessin +de points",
                        actions: "removeLastPoint",
                        internal: true
                    },

                    Enter: {
                        target: "idle",
                        actions: "saveLine"
                    },

                    Escape: "idle",

                    MOUSECLICK: {
                        target: "Dessin +de points",
                        internal: true,
                        cond: "pasPlein"
                    }
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
