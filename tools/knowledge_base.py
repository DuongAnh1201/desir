#this file is used to define the knowledge of the agent.
from config import settings
import json
from pathlib import Path
data = json.load(open(Path(__file__).parent / 'graph.json'))
def _save_graph():
    with open(Path(__file__).parent / 'graph.json', 'w') as f:
        json.dump(data, f, indent=2)

def create_new_file(file_name: str, file_content: str):
    """
    Create a new file with the given name and content.
    """
    with open(settings.file_path + file_name + '.md', 'w+') as f:
        f.write(file_content)
    return f"File {file_name} created successfully at {settings.file_path}"

def read_file(file_name: str):
    """
    Read the content of the file with the given name.
    """
    with open(settings.file_path + file_name + '.md', 'r') as f:
        return f.read()
    return f"File {file_name} read successfully from {settings.file_path}"

def update_file(file_name: str, file_content: str):
    """
    Update the content of the file with the given name.
    """
    with open(settings.file_path + file_name + '.md', 'w+') as f:
        f.write(file_content)
    return f"File {file_name} updated successfully at {settings.file_path}"

def trace_context(file_name: str):
    """
    Trace the context of the file with the given name.
    """

    for node in data:
        if node == file_name:
            return data[file_name]
    data[file_name] = []
    _save_graph()

def add_context(file_name_1: str, file_name_2: str):
    """
    Add the context of the file with the given name.
    """
   

    #Check if already have connection
    m = trace_context(file_name_1)
    n = trace_context(file_name_2)
    data[file_name_1].append(file_name_2)
    data[file_name_2].append(file_name_1)
    _save_graph()


    return f"{file_name_1} and {file_name_2} has connection now."
