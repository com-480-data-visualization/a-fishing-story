# Project of Data Visualization (COM-480)

| Student's name | SCIPER |
| -------------- | ------ |
| Alexandre Goumaz | 333934 |
| Mathieu Senent | 362767 |
| Nayan Adani |326841 |

[Milestone 1](#milestone-1) • [Milestone 2](#milestone-2) • [Milestone 3](#milestone-3)

## Milestone 1 (20th March, 5pm)

**10% of the final grade**

This is a preliminary milestone to let you set up goals for your final project and assess the feasibility of your ideas.
Please, fill the following sections about your project.

*(max. 2000 characters per section)*

### Dataset

> Find a dataset (or multiple) that you will explore. Assess the quality of the data it contains and how much preprocessing / data-cleaning it will require before tackling visualization. We recommend using a standard dataset as this course is not about scraping nor data processing.
>
> Hint: some good pointers for finding quality publicly available datasets ([Google dataset search](https://datasetsearch.research.google.com/), [Kaggle](https://www.kaggle.com/datasets), [OpenSwissData](https://opendata.swiss/en/), [SNAP](https://snap.stanford.edu/data/) and [FiveThirtyEight](https://data.fivethirtyeight.com/)).

For this project, we are using two data sources to ensure the reliability of our analysis.
1. [Global Fishing Watch](https://globalfishingwatch.org): The dataset *AIS Apparent Fishing Effort*, this dataset provides information on fishing vessel activity detected via the Automatic Identification System (AIS).
Content: Geographical coordinates (lat, lon), fishing time (fishing_hours), vessel flag (flag) and gear type (geartype).
Quality: The data is of high quality and already aggregated by grid cells (e.g. 0.1°), which facilitates large-scale visualisation.
2. Marine Regions: We use the global maritime zones database to obtain the boundaries of Exclusive Economic Zones (EEZs).
Content: Shapefiles (GeoJSON/TopoJSON) representing the polygons of each country’s sovereign maritime boundaries.
Quality: This is the global reference for maritime boundaries, ensuring rigorous geographical accuracy. Merging and data cleaning analysis
The main challenge of pre-processing is to determine, for each GFW data point, whether it lies within an EEZ polygon (belonging to a specific country) or on the High Seas (international waters).

### Problematic

> Frame the general topic of your visualization and the main axis that you want to develop.
> - What am I trying to show with my visualization?
> - Think of an overview for the project, your motivation, and the target audience.

Invisible Borders: Mapping Global Fishing Effort between Sovereignty and the High Seas

### Exploratory Data Analysis

> Pre-processing of the data set you chose
> - Show some basic statistics and get insights about the data

#### Pre-processing

The *AIS Apparent Fishing Effort* dataset has data spanning from 2012 to 2024, it has 3 types of data: daily & monthly apparent fishing effort, as well as daily [MMSI](https://en.wikipedia.org/wiki/Maritime_Mobile_Service_Identity) data. This represent a very large amount of data.
We chose to focus on the data spanning from 2020 to 2024 as an initial effort. The raw format used in the dataset is CSV, which is ill-suited in this case, as the dataset is composed of close to 2 billions records for ~93GB.
Our first step has been to convert the data from CSV format to [parquet](https://parquet.apache.org) format, this was done in [data_processing.ipynb](notebooks/data_processing.ipynb), with results described in [data-processing.md](data-processing.md).

#### Data Exploration

We did data exploration in [explore.ipynb](notebooks/explore.ipynb).

### Related work

> - What others have already done with the data?

Most projects using Global Fishing Watch data, including their own interactive map, focus on global heatmaps of fishing density or tracking individual vessels to detect illegal activities. Researchers typically use this data to quantify the environmental impact of industrial fishing on a global scale.

[Global Fishing Watch Publications](https://globalfishingwatch.org/publications/)

> - Why is your approach original?

Our approach is unique because it shifts the focus from "where" to "under whose authority". By performing a spatial join with Marine Regions' EEZ polygons, we categorize fishing effort into three distinct geopolitical zones: Domestic, Foreign Incursion, and High Seas. This allows us to visualize the export of industrial fishing pressure across sovereign borders, a perspective rarely highlighted in standard density maps.

> - What source of inspiration do you take? Visualizations that you found on other websites or magazines (might be unrelated to your data).

* [Global Fishing Watch Map](https://globalfishingwatch.org/map/index)
* [MarineTraffic Map](https://www.marinetraffic.com/en/ais/home/centerx:30.9/centery:11.4/zoom:3)

> - In case you are using a dataset that you have already explored in another context (ML or ADA course, semester project...), you are required to share the report of that work to outline the differences with the submission for this class.

## Milestone 2 (17th April, 5pm)

## Project Goal

Our project aims to build an **interactive web-based visualization** of global fishing activity through a geopolitical lens.

The main idea is to go beyond a simple global heatmap and let users explore fishing activity **dynamically across space and time**, while understanding **who is fishing where, and under whose authority**.

The central element of the website is an **interactive world map** displaying fishing vessel activity. Users will be able to zoom and move across the globe, and the visualizations will update depending on the visible area.

A key addition to this project is the integration of **Exclusive Economic Zones (EEZs)**. These maritime zones will be displayed directly on the map using distinct colors for each country. This allows us to clearly distinguish between national waters and international waters.

By combining fishing activity data with EEZ boundaries, we can identify whether a vessel is operating:
- within its own country's EEZ,
- inside a foreign EEZ,
- or in the High Seas.

This enables a more precise analysis of **foreign fishing activity and potential illegal behavior**, such as a vessel from one country operating inside another country's EEZ.

We also introduce a **storytelling component** through interactive points of interest (POIs) placed on meaningful maritime regions (e.g., South China Sea, North Atlantic). When clicked, these points trigger a zoom and display contextual explanations.

In addition, a **dynamic dashboard** linked to the current map view will provide:
- the distribution of vessels by country,
- the share of vessels operating in foreign EEZs,
- and the evolution of fishing activity over time.

Our target audience includes the general public, journalists, and anyone interested in environmental and geopolitical issues related to the oceans.

---

## Sketch of the Final Visualization


The final interface will contain the following elements:

- **Landing page**  
  <img width="1235" height="775" alt="Image" src="https://github.com/user-attachments/assets/e3b89a1e-e5eb-4367-ad7c-5e4e58ae3966" />
  A short introduction presenting the topic and the purpose of the project.

- **Main map view**
  <img width="1440" height="778" alt="Image" src="https://github.com/user-attachments/assets/1a3c2cd2-de96-4f06-87f1-35f215043532" />
  A world map showing fishing vessel activity, overlaid with **EEZ boundaries** colored by country. Users can zoom and pan to explore different regions.

- **Fishing activity layer**  
  Points or heatmap representing vessel activity on top of the EEZ map.

- **Interactive points of interest**
  <img width="1438" height="774" alt="Image" src="https://github.com/user-attachments/assets/2bde1f22-d2b7-457f-9be6-47c7b87b4d78" />
  Blinking markers placed on important maritime regions. When clicked, they trigger a zoom and display explanatory text about geopolitical or economic significance.

- **Dynamic charts linked to the map view**
  1. **Bubble chart**: proportion of vessels by country in the visible area  
  2. **Bar chart**: top 5 countries with the highest share of vessels operating in foreign EEZs (e.g., a Chinese vessel inside the French EEZ)  
  3. **Time series**: evolution of fishing activity over time in the visible area  

These components together allow users to explore both **spatial patterns** and **jurisdictional dynamics** of global fishing.

---

## Tools and Technologies

## Tools

### Frontend

The interactive map is built with [deck.gl (v9)](https://deck.gl), a WebGL-powered geospatial rendering framework, on top of [maplibre-gl](https://maplibre.org/maplibre-gl-js/docs) for tile-based basemap rendering. [react-map-gl](https://visgl.github.io/react-map-gl) integrates maplibre into the [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org) component tree, bundled with [Vite](https://vitejs.dev).

All three analytical charts are rendered as **custom SVG** directly in React, without any external charting library, giving full control over layout, animation, and styling.

There is no backend. Data queries run entirely client-side using [DuckDB WASM](https://duckdb.org/docs/api/wasm/overview) in a Web Worker — an in-process analytical SQL engine compiled to WebAssembly that reads [Parquet](https://parquet.apache.org) files hosted on [Hugging Face Hub](https://huggingface.co). Query results are consumed via the [apache-arrow](https://arrow.apache.org/docs/js) JavaScript library. The frontend is deployed as a fully static build on GitHub Pages.

### Data

The raw Global Fishing Watch AIS data was pre-processed from CSV to **Parquet** format, with EEZ membership pre-joined from Marine Regions shapefiles.

## Lectures

* **Interaction**: Use zoom/pan, filtering, linking, and overview→details workflows to let users explore fishing data dynamically on the map 
* **Perception & Colors**: Use appropriate color scales and preattentive features to make fishing patterns instantly readable 
* **Marks & Channels**: Represent fishing data with map-based marks and encode attributes using position, size, and color effectively 

---

## Prototype Status

At this stage, we already have:
- a **working landing page**,
- an initial **map visualization**,
- the interactive points of interest.
- and a processed dataset ready to be used efficiently.

The next implementation steps are:
1. connect the map to dynamic filtering based on the visible region,
2. implement the three charts
3. the EEZ data and their representation on the map

Our goal for the final project is to combine exploratory interaction and narrative guidance in a single coherent interface.

Website is available at: https://com-480-data-visualization.github.io/a-fishing-story/

## Milestone 3 (29th May, 5pm)

**80% of the final grade**


## Late policy

- < 24h: 80% of the grade for the milestone
- < 48h: 70% of the grade for the milestone



