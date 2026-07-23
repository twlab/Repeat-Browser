# Download WashU Repeat Browser Data from AWS Open Data

The WashU Repeat Browser collection is being prepared for the Registry of Open Data on AWS. Replace `<bucket>` and `<region>` below after the final public S3 bucket is provisioned.

## Data structure

Data are organized by reference assembly and assay:

```text
<bucket>/
├── hg38/{atac-seq,cage-seq,newcage-seq,dnase-seq,chip-seq/{histone,tf}}/
├── mm10/{atac-seq,dnase-seq,chip-seq/{histone,tf}}/
├── documentation/
└── precomputedEnrichment/
```

The main formats are CSV metadata tables, BigWig signal tracks and Zarr v2 stores containing TE-subfamily, consensus and locus-level data.

## AWS CLI

Install the [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html), then use anonymous access:

```bash
# List the top level
aws s3 ls --no-sign-request s3://<bucket>/

# Download one metadata table
aws s3 cp --no-sign-request \
  s3://<bucket>/hg38/chip-seq/histone/hg38_Histone_Chipseq_all.csv \
  ./hg38_Histone_Chipseq_all.csv
```

To download a complete prefix, use `aws s3 cp --recursive`; Zarr stores contain many small objects and should normally be copied as a directory.

## HTTPS

Individual public objects can also be accessed without AWS credentials:

```bash
curl -O \
  https://<bucket>.s3.<region>.amazonaws.com/hg38/chip-seq/histone/hg38_Histone_Chipseq_all.csv
```

## Python

```python
import pandas as pd
import s3fs

fs = s3fs.S3FileSystem(anon=True)
path = "<bucket>/hg38/chip-seq/histone/hg38_Histone_Chipseq_all.csv"

with fs.open(path, "rb") as handle:
    metadata = pd.read_csv(handle)

print(metadata.head())
```

## Zarr locus chunks

File-mode stores use `loci_<subfamily>`. ChIP-seq Experiment-mode stores use `signal_loci_<subfamily>` and `control_loci_<subfamily>`. Each array stores repeating values in this order:

```text
chromosome, start, end, RPKM
```

Inspect `.zattrs`, `.zmetadata` and the selected array's `.zarray` before reading chunk `0`. See [README.md](README.md) and [get-to-know-washu-repeat-browser.ipynb](get-to-know-washu-repeat-browser.ipynb) for tested examples.

## Browser access

The same processed profiles can be explored in the [WashU Repeat Browser](https://repeatbrowser.org/). Public Zarr URLs used in the Browser must support HTTP access and CORS.
