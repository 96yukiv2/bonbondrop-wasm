use wasm_bindgen::prelude::*;

/// Offset of the sticker surface at a distance from the touch point.
#[wasm_bindgen]
pub fn dent(distance: f32) -> f32 {
    const DEPTH: f32 = 0.35;
    const RADIUS: f32 = 0.6;
    let normalized = distance.max(0.0) / RADIUS;
    -DEPTH * (-normalized * normalized).exp()
}

/// A damped spring controlling how deeply the sticker is pressed.
#[wasm_bindgen]
pub struct Spring {
    position: f32,
    velocity: f32,
}

#[wasm_bindgen]
impl Spring {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            position: 0.0,
            velocity: 0.0,
        }
    }

    /// target: 1.0 while pressed, 0.0 after release.
    /// dt: elapsed time in seconds, clamped to avoid large frame jumps.
    pub fn step(&mut self, dt: f32, target: f32) -> f32 {
        let dt = dt.clamp(0.0, 1.0 / 30.0);
        let target = target.clamp(0.0, 1.0);
        let stiffness = 90.0;
        let damping = 15.0;
        let acceleration = stiffness * (target - self.position) - damping * self.velocity;
        self.velocity += acceleration * dt;
        self.position += self.velocity * dt;
        self.position
    }

    pub fn position(&self) -> f32 {
        self.position
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn dent_is_deepest_at_center() {
        assert!((dent(0.0) + 0.35).abs() < 1e-6);
        assert!(dent(0.2) < dent(0.6));
        assert!(dent(0.6) < dent(2.0));
    }

    #[test]
    fn spring_returns_toward_rest_after_release() {
        let mut spring = Spring::new();
        for _ in 0..30 {
            spring.step(1.0 / 60.0, 1.0);
        }
        let pressed = spring.position();
        assert!(pressed > 0.5);
        for _ in 0..120 {
            spring.step(1.0 / 60.0, 0.0);
        }
        assert!(spring.position().abs() < 0.01);
    }
}
