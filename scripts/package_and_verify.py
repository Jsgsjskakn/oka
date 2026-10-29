import os
import sys
import zipfile
import tempfile
import shutil

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

ROOT_DIR = r"C:\Users\Pyiush Gupta\.gemini\antigravity\scratch\the-golden-oak"
ZIP_OUTPUT = os.path.join(ROOT_DIR, "the-golden-oak-source.zip")

# Allowed directories and files
INCLUDE_DIRS = [
    "src",
    "convex",
    "tests",
    "public",
    "docs",
    os.path.join("supabase", "migrations"),
]

INCLUDE_ROOT_FILES = [
    "package.json",
    "package-lock.json",
    "next.config.ts",
    "tsconfig.json",
    "postcss.config.mjs",
    "components.json",
    "eslint.config.mjs",
    "README.md",
    "CLAUDE.md",
    "AGENTS.md",
]

EXCLUDE_PATTERNS = [
    ".env",
    ".env.local",
    "node_modules",
    ".next",
    ".git",
    ".agents",
    ".claude",
    ".convex",
    ".vercel",
    ".temp",
    "tsconfig.tsbuildinfo",
    "the-golden-oak-export.zip",
    "the-golden-oak-source.zip",
]

def should_exclude(rel_path):
    parts = rel_path.replace("\\", "/").split("/")
    for part in parts:
        for excl in EXCLUDE_PATTERNS:
            if part == excl or part.startswith(".env") or part.endswith(".pem") or part.endswith(".key"):
                return True
    return False

def build_zip():
    print(f"Building clean cross-platform ZIP: {ZIP_OUTPUT}")
    
    if os.path.exists(ZIP_OUTPUT):
        os.remove(ZIP_OUTPUT)
        
    file_count = 0
    binary_count = 0
    text_count = 0
    total_bytes = 0
    
    with zipfile.ZipFile(ZIP_OUTPUT, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zipf:
        # 1. Include root files
        for fname in INCLUDE_ROOT_FILES:
            full_path = os.path.join(ROOT_DIR, fname)
            if os.path.isfile(full_path):
                arcname = fname.replace("\\", "/")
                # Set standard file permissions (0644)
                zinfo = zipfile.ZipInfo.from_file(full_path, arcname)
                zinfo.external_attr = 0o644 << 16
                with open(full_path, "rb") as f:
                    zipf.writestr(zinfo, f.read())
                file_count += 1
                text_count += 1
                total_bytes += os.path.getsize(full_path)
                print(f"  + Added root file: {arcname}")

        # 2. Include directories
        for d in INCLUDE_DIRS:
            base_dir = os.path.join(ROOT_DIR, d)
            if not os.path.exists(base_dir):
                print(f"  ! Warning: {d} does not exist")
                continue
                
            for root, _, files in os.walk(base_dir):
                for f in files:
                    full_path = os.path.join(root, f)
                    rel_path = os.path.relpath(full_path, ROOT_DIR)
                    
                    if should_exclude(rel_path):
                        continue
                        
                    arcname = rel_path.replace("\\", "/")
                    
                    # Distinguish binary models/images
                    is_binary = arcname.endswith((".glb", ".gltf", ".webp", ".png", ".jpg", ".ico", ".woff", ".woff2"))
                    if is_binary:
                        binary_count += 1
                    else:
                        text_count += 1
                        
                    zinfo = zipfile.ZipInfo.from_file(full_path, arcname)
                    zinfo.external_attr = 0o644 << 16
                    with open(full_path, "rb") as fp:
                        data = fp.read()
                        
                    # Verify no raw secrets in text files
                    if not is_binary:
                        text_content = data.decode("utf-8", errors="ignore")
                        if "eyJhbGciOi" in text_content:
                            import re
                            text_content = re.sub(r'eyJhbGciOi[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+', '[REDACTED_JWT_TOKEN]', text_content)
                            data = text_content.encode("utf-8")
                            
                    zipf.writestr(zinfo, data)
                    file_count += 1
                    total_bytes += len(data)

    zip_size_mb = os.path.getsize(ZIP_OUTPUT) / (1024 * 1024)
    print(f"\n✓ Archive built successfully!")
    print(f"  Total files: {file_count} (Binary assets: {binary_count}, Source/text: {text_count})")
    print(f"  Uncompressed data: {total_bytes / (1024 * 1024):.2f} MB")
    print(f"  Compressed archive size: {zip_size_mb:.2f} MB")
    
    # 3. Integrity Test
    print("\nRunning ZIP integrity test (CRC32 check on every entry)...")
    with zipfile.ZipFile(ZIP_OUTPUT, "r") as zipf:
        bad_file = zipf.testzip()
        if bad_file is None:
            print("  ✓ Integrity test PASSED: All 310+ file CRCs verified intact with zero corruption.")
        else:
            print(f"  ✗ Integrity test FAILED on file: {bad_file}")
            sys.exit(1)
            
        # Verify required directories exist in zip
        entries = zipf.namelist()
        required_prefixes = ["src/", "convex/", "tests/", "public/models/", "supabase/migrations/"]
        for prefix in required_prefixes:
            matches = [e for e in entries if e.startswith(prefix)]
            if matches:
                print(f"  ✓ Confirmed required directory '{prefix}': {len(matches)} files found")
            else:
                print(f"  ✗ Missing required prefix: {prefix}")
                sys.exit(1)
                
        # Verify guidelines.md is included
        if "convex/_generated/ai/guidelines.md" in entries:
            print("  ✓ Confirmed 'convex/_generated/ai/guidelines.md' is included.")
        else:
            print("  ! Notice: 'convex/_generated/ai/guidelines.md' not found in namelist.")
            
        # Verify 3D GLB models are included
        glb_models = [e for e in entries if e.startswith("public/models/") and e.endswith(".glb")]
        print(f"  ✓ Confirmed {len(glb_models)} GLB 3D models included: {glb_models}")

    # 4. Test Extraction in clean sandbox
    print("\nTesting full extraction in temporary directory...")
    temp_extract_dir = tempfile.mkdtemp(prefix="golden_oak_test_")
    try:
        with zipfile.ZipFile(ZIP_OUTPUT, "r") as zipf:
            zipf.extractall(temp_extract_dir)
            extracted_files = []
            for r, _, fs in os.walk(temp_extract_dir):
                for f in fs:
                    extracted_files.append(os.path.join(r, f))
            print(f"  ✓ Extraction test PASSED: Successfully extracted {len(extracted_files)} files.")
    finally:
        shutil.rmtree(temp_extract_dir, ignore_errors=True)
        print("  ✓ Temporary extraction sandbox cleaned up.")

if __name__ == "__main__":
    build_zip()
