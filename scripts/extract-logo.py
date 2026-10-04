from pathlib import Path
from pypdf import PdfReader

root = Path(__file__).resolve().parent.parent
reader = PdfReader(root / 'Pearl_Panda_Website_PRD_Industries_v2.pdf')
output = root / 'public' / 'brand'
output.mkdir(parents=True, exist_ok=True)
for index, image in enumerate(reader.pages[0].images):
    target = output / ('pearl-panda-original' + Path(image.name).suffix)
    target.write_bytes(image.data)
    print(target)
