use std::fmt;

const FELT_CENTER: u32 = 2_u32.pow(31) - 2;
const SQUARE_SIZE: u32 = 1_000_000;
const HALF_SQUARE_SIZE: u32 = SQUARE_SIZE / 2;

pub struct Position {
    x: u32,
    y: u32,
    normalized: bool,
}

impl Position {
    pub fn new(x: u32, y: u32) -> Self {
        // if outside of square 1_000_000 x 1_000_000 around the center, it's already normalized
        let normalized = (x as i64 - FELT_CENTER as i64).abs() > HALF_SQUARE_SIZE as i64
            || (y as i64 - FELT_CENTER as i64).abs() > HALF_SQUARE_SIZE as i64;
        Position { x, y, normalized }
    }

    #[allow(dead_code)]
    pub fn get_contract(&self) -> (u32, u32) {
        (
            if self.normalized {
                self.x + FELT_CENTER
            } else {
                self.x
            },
            if self.normalized {
                self.y + FELT_CENTER
            } else {
                self.y
            },
        )
    }

    pub fn get_normalized(&self) -> (u32, u32) {
        (
            if self.normalized {
                self.x
            } else {
                self.x - FELT_CENTER
            },
            if self.normalized {
                self.y
            } else {
                self.y - FELT_CENTER
            },
        )
    }
}

impl fmt::Display for Position {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "Position({}, {})", self.x, self.y)
    }
}
