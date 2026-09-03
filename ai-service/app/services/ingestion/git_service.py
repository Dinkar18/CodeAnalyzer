import os
import shutil
import logging
from git import Repo
from uuid import UUID
from typing import List, Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)

class GitService:
    def __init__(self, workspace_root: str = settings.WORKSPACE_DIR):
        self.workspace_root = workspace_root
        os.makedirs(self.workspace_root, exist_ok=True)

    def get_repo_dir(self, repository_id: UUID) -> str:
        return os.path.join(self.workspace_root, str(repository_id))

    def clone_or_fetch(self, repository_id: UUID, repo_url: str, branch: str = "main") -> tuple[str, str]:
        target_dir = self.get_repo_dir(repository_id)
        
        try:
            if os.path.exists(target_dir) and os.path.exists(os.path.join(target_dir, ".git")):
                logger.info(f"Repository {repository_id} already exists. Fetching updates...")
                repo = Repo(target_dir)
                origin = repo.remotes.origin
                origin.fetch()
                try:
                    repo.git.checkout(branch)
                    repo.git.pull("origin", branch)
                except Exception:
                    pass
            else:
                if os.path.exists(target_dir):
                    shutil.rmtree(target_dir)
                logger.info(f"Cloning {repo_url} into {target_dir}...")
                repo = Repo.clone_from(repo_url, target_dir, branch=branch)

            commit_sha = repo.head.commit.hexsha
            logger.info(f"Repository {repository_id} ready at commit {commit_sha}")
            return target_dir, commit_sha

        except Exception as e:
            logger.error(f"Git operation failed for {repo_url}: {e}")
            raise RuntimeError(f"Git operation failed: {e}")

    def list_branches(self, repository_id: UUID) -> List[str]:
        target_dir = self.get_repo_dir(repository_id)
        if not os.path.exists(target_dir) or not os.path.exists(os.path.join(target_dir, ".git")):
            return ["main"]
        try:
            repo = Repo(target_dir)
            try:
                repo.remotes.origin.fetch()
            except Exception:
                pass
            branches = set()
            for ref in repo.references:
                name = ref.name
                if 'HEAD' not in name:
                    clean_name = name.replace('origin/', '')
                    branches.add(clean_name)
            return sorted(list(branches)) if branches else ["main"]
        except Exception as e:
            logger.warning(f"Failed to list branches for {repository_id}: {e}")
            return ["main"]

    def get_diff(self, repository_id: UUID, base_branch: str = "main", target_branch: str = "HEAD") -> Dict[str, Any]:
        target_dir = self.get_repo_dir(repository_id)
        if not os.path.exists(target_dir):
            return {"diff": "", "files_changed": 0, "insertions": 0, "deletions": 0}
        try:
            repo = Repo(target_dir)
            diff_text = repo.git.diff(f"{base_branch}...{target_branch}")
            stats = repo.git.diff(f"{base_branch}...{target_branch}", "--stat")
            return {
                "base_branch": base_branch,
                "target_branch": target_branch,
                "diff": diff_text,
                "stats": stats
            }
        except Exception as e:
            logger.warning(f"Git diff failed: {e}")
            return {"error": str(e), "diff": "", "base_branch": base_branch, "target_branch": target_branch}

    def cleanup_workspace(self, repository_id: UUID):
        target_dir = self.get_repo_dir(repository_id)
        if os.path.exists(target_dir):
            shutil.rmtree(target_dir, ignore_errors=True)

git_service = GitService()
