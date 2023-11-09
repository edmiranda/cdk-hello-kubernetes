import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {CodeBuildStep, CodePipeline, CodePipelineSource} from "aws-cdk-lib/pipelines";
import * as ssm from 'aws-cdk-lib/aws-ssm';

export class PipelineIac extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
		
		const account = props?.env?.account!;
        const region = props?.env?.region!;
		const codearn = ssm.StringParameter.valueFromLookup(this, 'CodeStarArn');
		
        // Pipeline code goes here
        const pipeline = new CodePipeline(this, "ApplicationPipeline", {
			pipelineName: "ApplicationPipeline",
			synth: new CodeBuildStep("Synth", {
				input: CodePipelineSource.connection(
					"edmiranda/cdk-hello-kubernetes",
					"main",
					{ connectionArn: codearn}
				),
                commands: [
                    'yarn install --frozen-lockfile',
 			        'yarn build',
			        'npx cdk synth',
                ]
			}),
			//selfMutation: false
		});
    }
}