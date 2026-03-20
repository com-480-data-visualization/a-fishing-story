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
1. Global Fishing Watch: This dataset provides information on fishing vessel activity detected via the Automatic Identification System (AIS).
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

### Related work


> - What others have already done with the data?

Most projects using Global Fishing Watch data, including their own interactive map, focus on global heatmaps of fishing density or tracking individual vessels to detect illegal activities. Researchers typically use this data to quantify the environmental impact of industrial fishing on a global scale.

> - Why is your approach original?

Our approach is unique because it shifts the focus from "where" to "under whose authority". By performing a spatial join with Marine Regions' EEZ polygons, we categorize fishing effort into three distinct geopolitical zones: Domestic, Foreign Incursion, and High Seas. This allows us to visualize the export of industrial fishing pressure across sovereign borders, a perspective rarely highlighted in standard density maps.

> - What source of inspiration do you take? Visualizations that you found on other websites or magazines (might be unrelated to your data).

Global Fishing Watch Map

> - In case you are using a dataset that you have already explored in another context (ML or ADA course, semester project...), you are required to share the report of that work to outline the differences with the submission for this class.

## Milestone 2 (17th April, 5pm)

**10% of the final grade**


## Milestone 3 (29th May, 5pm)

**80% of the final grade**


## Late policy

- < 24h: 80% of the grade for the milestone
- < 48h: 70% of the grade for the milestone

