import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as yaml from 'yaml';

export class PipelineApplication extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
		
    		const account = props?.env?.account!;
            const region = props?.env?.region!;
    		const codearn = ssm.StringParameter.valueFromLookup(this, 'CodeStarArn');
    		const ecr_repo_name = "hello-kubernetes"
    		
    		const role = iam.Role.fromRoleArn(this, 'Role', `arn:aws:iam::${account}:role/cdk-iac-pipeline`, {
    		  mutable: false,
    		});
    		
    		const dockerBuild = yaml.parse(`
            version: 0.2

            phases:
              pre_build:
                commands:
                  - echo Logging in to Amazon ECR...
                  - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin ${account}.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
              build:
                commands:
                  - COMMIT_ID=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -b -8)
                  - echo $COMMIT_ID
                  - echo Build started
                  - echo Building the Docker image...          
                  - docker build -t ${ecr_repo_name}:$COMMIT_ID .
                  - docker tag ${ecr_repo_name}:$COMMIT_ID ${account}.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/${ecr_repo_name}:$COMMIT_ID      
              post_build:
                commands:
                  - echo Build completed
                  - echo Pushing the Docker image...
                  - docker push ${account}.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/${ecr_repo_name}:$COMMIT_ID
        `);
      
		
        const applicationProject = new codebuild.Project(this, "ApplicationBuild", {
          role: role,
          projectName: "ApplicationHello",
          buildSpec: codebuild.BuildSpec.fromObjectToYaml(dockerBuild),
          description: "Application Hello Project.",
          environment: {
            buildImage: codebuild.LinuxBuildImage.STANDARD_4_0,
            privileged: true,
          }
        });
        
        // Pipeline
        const sourceOutput = new codepipeline.Artifact();
        const pipeline = new codepipeline.Pipeline(this, "ApplicationPipeline", {
          pipelineName: "PipelineApplication",
          stages: [
            {
              stageName: 'Source',
              actions: [
                new codepipeline_actions.CodeStarConnectionsSourceAction({
                  actionName: 'Github_Source',
                  owner: 'edmiranda',
                  repo: 'hello-kubernetes',
                  branch: 'main',
                  output: sourceOutput,
                  connectionArn: codearn,
                }),
              ]
            },
            {
              stageName: 'Build',
              actions: [
                new codepipeline_actions.CodeBuildAction({
                  actionName: 'Build',
                  input: sourceOutput,
                  project: applicationProject,
                }),
              ]
            }
          ]
        });
    }
}