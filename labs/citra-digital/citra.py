#!/usr/bin/env python3
"""Headless edge-detection CLI — a NumPy port of the edge_methods/*.m operators
from the Tugas3_Citra-Digital coursework (the original was a MATLAB GUI that
can't run in a container). Classic operators only; the semantic-segmentation
half of the original needed a licensed MATLAB toolbox and is intentionally
dropped.

Usage:
    citra edge <image> <sobel|prewitt|roberts|laplace|log> [out.png]
"""
import sys
import numpy as np
from PIL import Image

KERNELS = {
    "sobel": (
        np.array([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], float),
        np.array([[-1, -2, -1], [0, 0, 0], [1, 2, 1]], float),
    ),
    "prewitt": (
        np.array([[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]], float),
        np.array([[-1, -1, -1], [0, 0, 0], [1, 1, 1]], float),
    ),
    "roberts": (
        np.array([[1, 0], [0, -1]], float),
        np.array([[0, 1], [-1, 0]], float),
    ),
}
LAPLACE = np.array([[0, 1, 0], [1, -4, 1], [0, 1, 0]], float)
# 5x5 Laplacian-of-Gaussian (sigma ~= 1.0), the standard discrete approximation.
LOG = np.array([
    [0,  0, -1,  0,  0],
    [0, -1, -2, -1,  0],
    [-1, -2, 16, -2, -1],
    [0, -1, -2, -1,  0],
    [0,  0, -1,  0,  0],
], float)


def convolve(img, kernel):
    """2D convolution with zero padding, expressed as a sum of shifted planes
    (fast enough for small kernels, no SciPy dependency)."""
    kh, kw = kernel.shape
    ph, pw = kh // 2, kw // 2
    padded = np.pad(img, ((ph, ph), (pw, pw)), mode="edge")
    out = np.zeros_like(img, dtype=float)
    for i in range(kh):
        for j in range(kw):
            out += kernel[i, j] * padded[i:i + img.shape[0], j:j + img.shape[1]]
    return out


def normalize(a):
    a = a - a.min()
    peak = a.max()
    if peak > 0:
        a = a / peak
    return (a * 255).astype(np.uint8)


def detect(gray, op):
    if op in KERNELS:
        gx, gy = KERNELS[op]
        return np.hypot(convolve(gray, gx), convolve(gray, gy))
    if op == "laplace":
        return np.abs(convolve(gray, LAPLACE))
    if op == "log":
        return np.abs(convolve(gray, LOG))
    raise ValueError(f"unknown operator: {op}")


def main(argv):
    if len(argv) < 3 or argv[0] != "edge":
        print(__doc__.strip())
        return 2
    op = argv[2].lower()
    if op not in (*KERNELS, "laplace", "log"):
        print(f"unknown operator '{op}'. choose: sobel prewitt roberts laplace log")
        return 2
    src, out = argv[1], (argv[3] if len(argv) > 3 else "edges.png")
    try:
        gray = np.asarray(Image.open(src).convert("L"), dtype=float)
    except FileNotFoundError:
        print(f"no such image: {src}")
        return 1
    edges = normalize(detect(gray, op))
    Image.fromarray(edges).save(out)
    print(f"{op} edges -> {out}  ({edges.shape[1]}x{edges.shape[0]}px)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
