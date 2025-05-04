import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { Slider, Button, Typography, List, ListItem, Container, Grid, Card, CardContent } from "@mui/material";
import brazoImagen from "./brazo_robotico.png";

const socket = io("http://localhost:3001");

const servos = [
  { id: 1, name: "Garra", min: 0, max: 90 },
  { id: 2, name: "Muñeca Pitch", min: 0, max: 180 },
  { id: 3, name: "Muñeca Yaw", min: 0, max: 180 },
  { id: 4, name: "Brazo", min: 0, max: 180 },
  { id: 5, name: "Antebrazo", min: 0, max: 180 },
  { id: 6, name: "Base", min: 0, max: 180 },
];

const App = () => {
  const [angles, setAngles] = useState(() => {
    const savedAngles = localStorage.getItem("servoAngles");
    return savedAngles ? JSON.parse(savedAngles) : servos.map(() => 90);
  });
  const [speed, setSpeed] = useState(() => {
    const savedSpeed = localStorage.getItem("servoSpeed");
    return savedSpeed ? JSON.parse(savedSpeed) : 5;
  });
  const [sequences, setSequences] = useState([]);
  const [currentSequence, setCurrentSequence] = useState([]);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    localStorage.setItem("servoAngles", JSON.stringify(angles));
    localStorage.setItem("servoSpeed", JSON.stringify(speed));
  }, [angles, speed]);

  useEffect(() => {
    socket.on("sequencesList", (data) => setSequences(data));
    return () => {
      socket.off("sequencesList");
    };
  }, []);

  const handleChange = (index, newValue) => {
    const newAngles = [...angles];
    newAngles[index] = newValue;
    setAngles(newAngles);
    socket.emit("move", { servo: servos[index].id, angle: newValue, speed });

    if (isRecording) {
      setCurrentSequence([...currentSequence, { servo: servos[index].id, angle: newValue, speed }]);
    }
  };

  const handleSpeedChange = (e, val) => {
    setSpeed(val);
  };

  const startRecording = () => {
    setIsRecording(true);
    setCurrentSequence([]);
  };

  const stopRecording = () => {
    setIsRecording(false);
    socket.emit("saveSequence", currentSequence);
  };

  const playSequence = () => {
    socket.emit("playSequence");
  };

  const downloadTxt = () => {
    socket.emit("downloadTxt", currentSequence);
  };
  

  const handleReset = () => {
    const defaultAngle = 90;
    const defaultSpeed = 3;
  
    // Emitir los movimientos al backend
    servos.forEach((servo) => {
      socket.emit("move", { servo: servo.id, angle: defaultAngle, speed: defaultSpeed });
    });
  
    // Actualizar el estado local para reflejar los cambios en el frontend
    setAngles(servos.map(() => defaultAngle));
    setSpeed(defaultSpeed);
  };
  

  return (
    <Container style={{ padding: 20, textAlign: "center", background: "#fff", color: "black", borderRadius: 10 }}>
      <Typography variant="h4" gutterBottom>
        Control del Brazo Robótico
      </Typography>

      <Grid container spacing={3} justifyContent="center">
        <Grid item xs={12} md={6}>
          <Card style={{ background: "#f0f0f0", padding: 20 }}>
            <CardContent>
              <img src={brazoImagen} alt="Brazo Robótico" style={{ width: "100%" }} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card style={{ background: "#f0f0f0", padding: 20 }}>
            <CardContent>
              {servos.map((servo, index) => (
                <div key={servo.id}>
                  <Typography variant="h6">{servo.name}</Typography>
                  <Slider
                    value={angles[index]}
                    onChange={(e, val) => handleChange(index, val)}
                    min={servo.min}
                    max={servo.max}
                    step={1}
                  />
                  <Typography>{angles[index]}°</Typography>
                </div>
              ))}

              <Typography variant="h6" style={{ marginTop: 20 }}>Velocidad</Typography>
              <Slider value={speed} onChange={handleSpeedChange} min={1} max={10} step={1} />
              <Typography>{speed}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="h5" style={{ marginTop: 30 }}>
        Grabación y Reproducción
      </Typography>

      <Grid container spacing={2} justifyContent="center">
        <Grid item>
          <Button variant="contained" color="secondary" onClick={startRecording} disabled={isRecording}>🎥 Iniciar Grabación</Button>
        </Grid>
        <Grid item>
          <Button variant="contained" color="primary" onClick={stopRecording} disabled={!isRecording}>⏹️ Detener Grabación</Button>
        </Grid>
        <Grid item>
          <Button variant="contained" color="success" onClick={playSequence}>▶️ Reproducir</Button>
        </Grid>
        <Grid item>
          <Button variant="contained" color="warning" onClick={downloadTxt}>📥 Descargar TXT</Button>
        </Grid>
        <Grid item>
          <Button variant="contained" color="warning" onClick={handleReset}>📥 Restablecer Brazo</Button>
        </Grid>
        <Grid item>
          <Button variant="contained" component="label" color="info">
            📤 Importar TXT
            <input
              type="file"
              hidden
              accept=".txt"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = function(event) {
                    const fileContent = event.target.result;
                    socket.emit("importTxt", fileContent); // Aquí lo mandamos al backend
                  };
                  reader.readAsText(file);
                }
              }}
            />
          </Button>
        </Grid>

      </Grid>

      <Typography variant="h5" style={{ marginTop: 20 }}>Secuencias Guardadas</Typography>
      <List>
        {sequences.map((seq, index) => (
          <ListItem key={index}>
            Secuencia {index + 1}
          </ListItem>
        ))}
      </List>
    </Container>
  );
};

export default App;