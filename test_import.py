import sys
import traceback

try:
    import backend.main
    print("Application imported successfully!")
except Exception as e:
    with open("import_error.txt", "w") as f:
        traceback.print_exc(file=f)
    print("Import failed. Traceback written to import_error.txt")
