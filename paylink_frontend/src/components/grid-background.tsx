import { useEffect, useRef } from 'react';

interface GridBackgroundProps {
    gridSize?: number;
    glowRadius?: number;
}

export default function GridBackground({
    gridSize = 7,
    glowRadius = 3
}: GridBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mousePos = useRef({ x: -1000, y: -1000 });
    const animationFrameId = useRef<number | undefined>(undefined);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size to full window
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Track mouse movement
        const handleMouseMove = (e: MouseEvent) => {
            mousePos.current = {
                x: e.clientX,
                y: e.clientY
            };
        };
        window.addEventListener('mousemove', handleMouseMove);

        // Draw grid with glow effect
        const draw = () => {
            // Clear canvas
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const { x: mouseX, y: mouseY } = mousePos.current;
            const effectRadius = gridSize * glowRadius;

            // Calculate grid dimensions
            const cols = Math.ceil(canvas.width / gridSize);
            const rows = Math.ceil(canvas.height / gridSize);

            // Draw grid vertices (corners of squares)
            for (let row = 0; row <= rows; row++) {
                for (let col = 0; col <= cols; col++) {
                    const x = col * gridSize;
                    const y = row * gridSize;

                    // Calculate distance from mouse
                    const dx = x - mouseX;
                    const dy = y - mouseY;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    // Determine vertex brightness based on distance
                    let alpha = 0.15; // Base alpha for grid
                    let size = 1; // Base size

                    if (distance < effectRadius) {
                        // Calculate glow intensity (inverse of distance)
                        const intensity = 1 - (distance / effectRadius);
                        alpha = 0.15 + (intensity * 0.85); // Range from 0.15 to 1
                        size = 1 + (intensity * 2); // Size grows up to 3px

                        // Add electric green glow for close vertices
                        if (intensity > 0.5) {
                            ctx.shadowBlur = 10 * intensity;
                            ctx.shadowColor = '#00FF9D';
                        }
                    }

                    // Draw vertex point
                    ctx.fillStyle = `rgba(0, 255, 157, ${alpha})`;
                    ctx.beginPath();
                    ctx.arc(x, y, size, 0, Math.PI * 2);
                    ctx.fill();

                    // Reset shadow
                    ctx.shadowBlur = 0;
                }
            }

            // Draw grid lines (subtle)
            ctx.strokeStyle = 'rgba(51, 51, 51, 0.3)';
            ctx.lineWidth = 0.5;

            // Vertical lines
            for (let col = 0; col <= cols; col++) {
                const x = col * gridSize;
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
            }

            // Horizontal lines
            for (let row = 0; row <= rows; row++) {
                const y = row * gridSize;
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }

            animationFrameId.current = requestAnimationFrame(draw);
        };

        // Start animation loop
        draw();

        // Cleanup
        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [gridSize, glowRadius]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: -1,
                pointerEvents: 'none'
            }}
        />
    );
}
