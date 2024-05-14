# TSW_ETCS
The old version of TSWOCR ETCS DMI focused on providing stop assist, as well as autopilot. While some people could be more interested in automating the Train Sim World, there were clear limitations in providing full compatibility for notch-controlled trains. Therefore, I decided to create a new ETCS DMI software that focuses on implementing the ETCS standard.

For example, the old one provided stopping brake curve based on 'object under constant acceleration' physics model. When user stops at the point where max speed becomes 0, that's the exact stopping point in TSW.

In this new version, (the plan is, ) if a signal light is placed within 500 meters from stop point, it is considered the exit signal in 'red state', and DMI will calculate the braking curve to it as defined in ETCS specifications. If there's no signal light, we'll assume a virtual ETCS balise that functions as red light signal. (Some routes in TSW don't always have exit signal, but ETCS mostly needs it)

If such curve is followed, the train will stop at around 10-30 meters ahead of the signal light, instead of aiming exactly at the stopping point.

The old DMI isn't open-source. As I add only parts necessary to ETCS DMI, this project aims to reveal everything that's included in ETCS specs (that is, my own implementation of autopilot will not be included.)

# Development environment

## Build system
We use webpack and node.js to build this project. The project is written in TypeScript. I'm using configurations that I've been used to, but I'm always open to suggestions. I'm not good at configuring webpack and build chain, so again I'm always open to suggestions.

While the previous version insisted on using plain dom, I decided to use React for this project.

## Branching
At first, we only have main branch, known as trunk-based development. When making a major change, create a new branch. Build number is only used to check if the latest version is being shown, so it can be duplicated in different branches. However, the main sequence should be kept in main branch.

## TSW-DMI interface
There's a separate interface project called 'TSWOCR'. It's written in C# and is used to read the screen of TSW. It's not included in this repository. It's a separate project that I'm working on. It's open-source. Refer to [this repository](https://github.com/asdf1280/tswocr-ws) for more information.

It also includes a WebSocket and HTTP server that sends the data to the DMI. The DMI will connect to this server to receive the data.

# ERTMS/ETCS

## Specifications
In this project, we try our best to implement ETCS baseline 4.0.0 issued on July 5, 2023. The document is available [here](https://www.era.europa.eu/era-folder/1-ccs-tsi-appendix-mandatory-specifications-etcs-b4-r1-rmr-gsm-r-b1-mr1-frmcs-b0-ato-b1)

## **We implement touch screen DMI!**

**SUBSET-026** and **ERA_ERTMS_015560** will be especially useful.

This means **we don't have ETCS level 3**. Level 3 was removed in baseline 4.

We don't consider ATO, FRMCS, or GSM-R. We only consider ERTMS/ETCS. If a wireless communication is needed, we focus on drawing it as if it were working and rely on live data from TSW.

About NTC(National Train Control), we will only add PZB/LZB mode. Basically it is a cosmetic system that triggers 1000 Hz/500 Hz monitoring on user click. If the train gets close to a red signal, 500 Hz should be automatically triggerd. LZB isn't considered in this project. However, I have no idea how PZB NTC looks like, so it won't be implemented very soon.

SBI(Service Brake Intervention) and EBI(Emergency Brake Intervention) are not implemented. However, we display on the DMI that the system would intervene in real life. While the original ETCS doesn't have visible discerment between SBI and EBI, we'll try to make it clear.

About screen ratio, ETCS requires DMI to have exactly 4:3 ratio. We'll create a rectangle in the center of the screen with 4:3 ratio, that reaches the maximum size possible. Remaining space will be filled with black. This is different from the previous version, which had dynamic screen ratio. Thus, we can ensure that the DMI is displayed correctly on any screen without having to worry about the aspect ratio. Just focus on the relative positions and sizes.

The font used is 'Verdana'. It's recommended in the specification. All parts of the DMI should be in this font.

The train data entry type used, defined in '11.3.9.6', is 'Flexible train data entry'. *Later*, we might want to implement to 'Switchable train data entry' and unrealistic ways of managing train preset. (like uploading JSON file)

5.2.2 Luminance adjustment: Your iPad does it. Don't implement it here.
5.2.3 Loudspeaker adjustment: Your iPad does it. Don't implement it here.

## Unrealistic features
Since there's no trackside balises in TSW, we'll assume that the balises are placed at the signal lights. This is unrealistic, but we'll try to make it as realistic as possible. If the signal light is too far away from departure point, we assume infill balises are placed in between, to prevent causing delay in the train.

About level changes, there's no level change balise either. We'll add a simulation menu, where user can change the level of ETCS. When user chooses a new level, we assume the train has passed 'upcoming level change' balise, and simulate 'level change ack' and 'level change' balise after a certain distance.

## Modularization
The old DMI was sphagetti code. I'm trying to make this project more modularized.

The main components include:

[ Receiving data from TSW ] While TSWOCR C# engine tries to read as accurately as possible, some kind of data need to be filtered again in this engine. In turn, it would return fine readings of screen.

[ Driver Machine Interface ] The GUI for this project.

[ Trackside Data Manager ] Includes speed limit/signal from TSW, simulated balises and other trackside data. Each single unit of data is stored separately. They may be dependent on specific level, mode, or nothing(e.g. level change balise).

[ Levels ] Each ETCS level has different class. The class would provide 'updating HTML elements', 'update per tick', 'rendering DMI'. 

[ Modes ] There's always a single mode that is active. It depends on both current operating level and the current state of train.