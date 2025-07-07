import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import './App.css';

const socket = io('http://localhost:5000'); // Connect to your backend server

function App() {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastCoord, setLastCoord] = useState({ x: 0, y: 0 });
  const [currentColor, setCurrentColor] = useState('black');
  const [currentLineWidth, setCurrentLineWidth] = useState(5);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    contextRef.current = context;

    // Function to set canvas dimensions
    const setCanvasDimensions = () => {
      const scale = window.devicePixelRatio; // Get the device pixel ratio
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * scale);
      canvas.height = Math.floor(rect.height * scale);
      context.scale(scale, scale); // Scale the context to match the device pixel ratio
      context.lineCap = 'round';
      context.imageSmoothingEnabled = true;
      // Clear canvas after resizing to prevent artifacts
      context.clearRect(0, 0, canvas.width, canvas.height);
    };

    // Initial setup
    setCanvasDimensions();

    // Resize observer to handle responsive canvas
    const resizeObserver = new ResizeObserver(() => {
      setCanvasDimensions();
    });
    resizeObserver.observe(canvas);

    socket.on('drawing', (data) => {
      const { x0, y0, x1, y1, color, lineWidth } = data;
      if (contextRef.current) {
        contextRef.current.strokeStyle = color;
        contextRef.current.lineWidth = lineWidth;
        contextRef.current.beginPath();
        contextRef.current.moveTo(x0, y0);
        contextRef.current.lineTo(x1, y1);
        contextRef.current.stroke();
      }
    });

    socket.on('clear', () => {
      if (contextRef.current) {
        const currentCanvas = canvasRef.current;
        const currentContext = contextRef.current;
        currentContext.clearRect(0, 0, currentCanvas.width, currentCanvas.height);
      }
    });

    return () => {
      socket.off('drawing');
      socket.off('clear');
      resizeObserver.unobserve(canvas);
    };
  }, []); // Removed dependencies to useEffect

  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    if (contextRef.current) {
      contextRef.current.strokeStyle = currentColor; // Set current color
      contextRef.current.lineWidth = currentLineWidth; // Set current line width
      contextRef.current.beginPath();
      contextRef.current.moveTo(offsetX, offsetY);
    }
    setIsDrawing(true);
    setLastCoord({ x: offsetX, y: offsetY });
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) {
      return;
    }
    const { offsetX, offsetY } = nativeEvent;
    if (contextRef.current) {
      contextRef.current.lineTo(offsetX, offsetY);
      contextRef.current.stroke();
    }

    socket.emit('drawing', {
      x0: lastCoord.x,
      y0: lastCoord.y,
      x1: offsetX,
      y1: offsetY,
      color: currentColor,
      lineWidth: currentLineWidth,
    });
    setLastCoord({ x: offsetX, y: offsetY });
  };

  const finishDrawing = () => {
    if (contextRef.current) {
      contextRef.current.closePath();
    }
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (contextRef.current) {
      contextRef.current.clearRect(0, 0, canvas.width, canvas.height);
    }
    socket.emit('clear');
  };

  return (
    <div className="App">
      <h1>Real-Time Collaborative Whiteboard</h1>

      <div className="controls">
        <button onClick={clearCanvas}>Clear Canvas</button>

        <div>
          <label htmlFor="color">Color:</label>
          <input
            type="color"
            id="color"
            value={currentColor}
            onChange={(e) => setCurrentColor(e.target.value)}
          />
        </div>

        <div className="color-palette">
          <div
            className="color-box"
            style={{ backgroundColor: '#FF0000' }}
            onClick={() => setCurrentColor('#FF0000')}
          ></div>
          <div
            className="color-box"
            style={{ backgroundColor: '#0000FF' }}
            onClick={() => setCurrentColor('#0000FF')}
          ></div>
          <div
            className="color-box"
            style={{ backgroundColor: '#008000' }}
            onClick={() => setCurrentColor('#008000')}
          ></div>
          <div
            className="color-box"
            style={{ backgroundColor: '#FFFF00' }}
            onClick={() => setCurrentColor('#FFFF00')}
          ></div>
          <div
            className="color-box"
            style={{ backgroundColor: '#000000' }}
            onClick={() => setCurrentColor('#000000')}
          ></div>
          <div
            className="color-box"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid #ccc' }}
            onClick={() => setCurrentColor('#FFFFFF')}
          ></div>
        </div>

        <div>
          <label htmlFor="lineWidth">Line Width:</label>
          <input
            type="range"
            id="lineWidth"
            min="1"
            max="10"
            value={currentLineWidth}
            onChange={(e) => setCurrentLineWidth(e.target.value)}
          />
          <span>{currentLineWidth}</span>
        </div>
      </div>

      <div className="canvas-container">
        <canvas
          onMouseDown={startDrawing}
          onMouseUp={finishDrawing}
          onMouseMove={draw}
          ref={canvasRef}
        />
      </div>
    </div>
  );
}

export default App;
