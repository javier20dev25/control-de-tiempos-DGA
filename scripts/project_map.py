import os

def generate_map(root_dir, exclude_dirs=None):
    if exclude_dirs is None:
        exclude_dirs = {'.git', 'node_modules', '.firebase', '.vercel', 'dist'}
    
    print(f"Mapping Project: {os.path.basename(os.path.abspath(root_dir))}")
    print("="*50)
    
    for root, dirs, files in os.walk(root_dir):
        # Exclude directories
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        
        level = root.replace(root_dir, '').count(os.sep)
        indent = ' ' * 4 * (level)
        print(f"{indent}{os.path.basename(root)}/")
        
        sub_indent = ' ' * 4 * (level + 1)
        for f in files:
            if f.endswith('.js') or f.endswith('.css') or f.endswith('.html') or f.endswith('.md'):
                print(f"{sub_indent}- {f}")

if __name__ == "__main__":
    generate_map('.')
