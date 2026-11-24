import unittest

import numpy as np

from analyze import box_keypoints, order_corners, project_points


class CoordinateMappingTests(unittest.TestCase):
    def test_orders_skewed_board_corners(self):
        points = np.array([[90, 60], [20, 15], [110, 125], [15, 100]], dtype=np.float32)

        ordered = order_corners(points)

        np.testing.assert_array_equal(
            ordered,
            np.array([[20, 15], [90, 60], [110, 125], [15, 100]], dtype=np.float32),
        )

    def test_maps_component_center_and_corners_to_board_units(self):
        board = np.array([[0, 0], [100, 0], [100, 50], [0, 50]], dtype=np.float32)
        points = box_keypoints((25, 10, 75, 40))

        mapped = project_points(board, points, 400, 200)

        self.assertEqual(mapped["P1"], {"x": -100.0, "y": -60.0})
        self.assertEqual(mapped["P3"], {"x": 100.0, "y": 60.0})
        self.assertEqual(mapped["centro"], {"x": 0.0, "y": 0.0})


if __name__ == "__main__":
    unittest.main()
