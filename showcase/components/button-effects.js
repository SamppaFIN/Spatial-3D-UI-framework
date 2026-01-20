// Visual effects for Button3D showcase
// Loading spinner, pulse animation, and ripple effect

export function createLoadingSpinner(config, scene) {
    const spinnerGeo = new THREE.TorusGeometry(0.3, 0.05, 16, 32);
    const spinnerMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const spinner = new THREE.Mesh(spinnerGeo, spinnerMat);
    spinner.position.z = config.depth / 2 + 0.2;
    scene.add(spinner);
    return spinner;
}

export function createPulseGlow(config, scene) {
    const glowGeo = new THREE.SphereGeometry(Math.max(config.width, config.height) / 2 + 0.3, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
        color: config.color,
        transparent: true,
        opacity: 0.2
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    scene.add(glow);
    return glow;
}

export function createRipple(config, color, scene) {
    const rippleGeo = new THREE.RingGeometry(0.1, 0.2, 32);
    const rippleMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide
    });
    const ripple = new THREE.Mesh(rippleGeo, rippleMat);
    ripple.position.z = config.depth / 2 + 0.05;
    scene.add(ripple);
    return ripple;
}

export function updateEffects(button, config) {
    // Loading spinner rotation
    if (button.loadingSpinner && config.loading) {
        button.loadingSpinner.rotation.z += 0.05;
    }

    // Pulse animation
    if (button.pulseGlow && config.pulseAnimation) {
        button.pulseTime = (button.pulseTime || 0) + 0.05;
        const scale = 1 + Math.sin(button.pulseTime) * 0.1;
        button.pulseGlow.scale.set(scale, scale, scale);
        button.pulseGlow.material.opacity = 0.1 + Math.sin(button.pulseTime) * 0.1;
    }

    // Ripple effects
    if (button.ripples) {
        for (let i = button.ripples.length - 1; i >= 0; i--) {
            const ripple = button.ripples[i];
            ripple.scale.x += 0.1;
            ripple.scale.y += 0.1;
            ripple.material.opacity -= 0.02;
            if (ripple.material.opacity <= 0) {
                button.scene.remove(ripple);
                ripple.geometry.dispose();
                ripple.material.dispose();
                button.ripples.splice(i, 1);
            }
        }
    }
}
