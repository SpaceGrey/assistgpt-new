<center><h1>Front-end of AssistGUI</h1
  ></center>

​		ASSISTGUI is a benchmark designed to evaluate models' abilities to automate tasks on the Windows platform by manipulating the mouse and keyboard. It consists of 100 tasks from popular software like After Effects and MS Word, each with accompanying project files. The goal is to assess the effectiveness of GUI automation and foster progress in this field.

https://arxiv.org/abs/2312.13108

	## Project Setup

```bash
pip install -r requirements.txt
```

```bash
npm install
```

### Compile and Hot-Reload for Development

```bash
npm run dev
```

### Compile and Minify for Production

```bash
npm run build
```



## Usage

<img src="https://gitee.com/SpaceGrey0223/typora/raw/master/20240202130708.png" alt="Screenshot 2024-02-02 at 1.06.47 PM" style="zoom:25%;" /><img src="/Users/grey/Library/Application Support/typora-user-images/Screenshot 2024-02-02 at 1.11.24 PM.png" alt="Screenshot 2024-02-02 at 1.11.24 PM" style="zoom:25%;" />



1. The App will automatically show all current apps you are now opening.
2. Select an app, input your needs, and press the send button.
3. The LLM at the backend will generate the steps
4. Press continue, and the client will automatically open the corresponding window and automatically control the software.

<img src="https://gitee.com/SpaceGrey0223/typora/raw/master/20240202131613.png" alt="Screenshot 2024-02-02 at 1.16.06 PM" style="zoom:25%;" />



