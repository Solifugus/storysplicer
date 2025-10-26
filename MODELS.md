# Model Setup for StorySplicer

StorySplicer uses two LLM models for character behavior:

## Required Models

### 1. Llama-3.2-3B-Instruct (Minor Characters)
- **Size**: ~2.2GB VRAM (Q5_K_M quantization)
- **Context**: 2048 tokens
- **Download**: https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF
- **File**: `llama-3.2-3b-instruct.Q5_K_M.gguf`

**Note**: An uncensored version is preferred but requires HuggingFace authentication. The system will automatically use the standard version if the uncensored one is not available.

### 2. Qwen2-7B-Instruct (Story Characters)
- **Size**: ~5.1GB VRAM (Q5_K_M quantization)
- **Context**: 4096 tokens
- **Download**: https://huggingface.co/Qwen/Qwen2-7B-Instruct-GGUF
- **File**: `qwen2-7b-instruct.Q5_K_M.gguf`

**Total VRAM**: ~7.3GB (fits in RTX 3070 8GB)

## Installation

1. Create models directory:
```bash
mkdir -p models
cd models
```

2. Download Llama-3.2-3B (Minor Characters):
```bash
# Standard version (no auth required)
wget -O llama-3.2-3b-instruct.Q5_K_M.gguf \
  "https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q5_K_M.gguf"

# Optional: Uncensored version (requires HuggingFace auth)
# wget -O llama-3.2-3b-instruct-uncensored.Q5_K_M.gguf \
#   "https://huggingface.co/hugging-quants/Llama-3.2-3B-Instruct-uncensored-GGUF/resolve/main/llama-3.2-3b-instruct-uncensored.Q5_K_M.gguf"
```

3. Download Qwen2-7B (Story Characters):
```bash
wget -O qwen2-7b-instruct.Q5_K_M.gguf \
  "https://huggingface.co/Qwen/Qwen2-7B-Instruct-GGUF/resolve/main/qwen2-7b-instruct-q5_k_m.gguf"
```

4. Verify files:
```bash
ls -lh *.gguf
```

You should see:
```
llama-3.2-3b-instruct.Q5_K_M.gguf (~2.2GB)
qwen2-7b-instruct.Q5_K_M.gguf (~5.1GB)
```

## Install huggingface-cli (Optional but Recommended)

```bash
pip install huggingface-hub
```

## Hardware Requirements

- **GPU**: RTX 3070 (8GB VRAM) or better
- **RAM**: 16GB minimum, 64GB recommended
- **Disk**: ~8GB for models

## Future Upgrades

When upgrading to RTX 3090 or better (24GB VRAM), you can use:
- Larger models (13B, 30B+)
- Higher precision quantization (Q6_K, Q8_0, or even FP16)
- Larger context windows (8K, 16K, 32K+)

## Quantization Notes

We use Q5_K_M quantization because:
- Good quality/size balance
- Avoids quality issues of 4-bit (Q4)
- Significantly smaller than Q8 or FP16
- Excellent for creative text generation

## Testing Models

After downloading, test the models:

```bash
npm run agent
```

This will load both models and verify they work correctly.
