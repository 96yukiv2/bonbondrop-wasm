use wasm_bindgen::prelude::*;

/// Returns a downward offset based on distance from the pressed point.
/// This is a deformation prototype, not yet a spring simulation.
#[wasm_bindgen]
pub fn dent(distance: f32) -> f32 {
    const DEPTH: f32 = 0.35;
    const RADIUS: f32 = 0.6;

    let normalized = distance.max(0.0) / RADIUS;
    -DEPTH * (-normalized * normalized).exp()
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
}
